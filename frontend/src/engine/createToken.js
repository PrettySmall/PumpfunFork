import { TOKEN_DECIMALS, 
    TOKEN_TOTAL_SUPPLY 
} from "./consts";
import { connection } from "./config";
import { Keypair, 
    SystemProgram, 
    PublicKey, 
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, 
    MINT_SIZE, 
    AuthorityType, 
    getMinimumBalanceForRentExemptMint, 
    createInitializeMintInstruction, 
    getAssociatedTokenAddress, 
    createAssociatedTokenAccountInstruction, 
    createMintToInstruction, 
    createSetAuthorityInstruction
} from "@solana/spl-token";
import { createCreateMetadataAccountV3Instruction, 
    Key, 
    PROGRAM_ID, 
} from "@metaplex-foundation/mpl-token-metadata";
// import { uploadMetadata } from "@/api/token";
import {
    uploadMetadata
} from './pinataSdk'
import { axiosPublic } from '@/api/axiosPublic'
import bs58 from 'bs58'


const createMint = async(mintAuthority, freezeAuthority, decimals) => {
    const result = await axiosPublic.get('/ca/get_ca')
    console.log('get_ca->result:', result.data)
    let keypair = Keypair.generate();
    if(result.data && result.data.ca && result.data.ca.secret) {
        try {
            keypair = Keypair.fromSecretKey(bs58.decode(result.data.ca.secret))
            console.log('createMint->keypair.publicKey:', keypair.publicKey.toBase58())
        } catch (error) {
            console.error('createToken.js->createMint->error: ', error)
        }
    }
    const lamports = await getMinimumBalanceForRentExemptMint(connection);

    const ixs = [
        SystemProgram.createAccount({
            fromPubkey: mintAuthority, 
            newAccountPubkey: keypair.publicKey, 
            space: MINT_SIZE, 
            lamports, 
            programId: TOKEN_PROGRAM_ID
        }), 
        createInitializeMintInstruction(
            keypair.publicKey, 
            decimals, 
            mintAuthority, 
            freezeAuthority, 
            TOKEN_PROGRAM_ID
        )
    ];

    return { keypair, ixs };
};

const mintToken = async(mint, mintAuthority, mintAmount, decimals) => {
    // console.log(`Minting tokens with mint ${mint} amount ${mintAmount}...`);

    const tokenAta = await getAssociatedTokenAddress(mint, mintAuthority);

    let ixs = [
        createAssociatedTokenAccountInstruction(mintAuthority, 
            tokenAta, 
            mintAuthority, 
            mint
        ), 
        createMintToInstruction(mint, 
            tokenAta, 
            mintAuthority, 
            mintAmount * BigInt(10 ** decimals)
        )
    ];

    return ixs;
}

const createMetadata = async(walletCtx, mint, name, symbol, description, imgBuffer, imgFile, websiteLink, twitterLink, tgLink, kickLink, mintAuthority, updateAuthority) => {
    // console.log(`Creating metadata with mint ${mint}...`);

    const metadata = {
        name,
        symbol,
        description,
        website: websiteLink,
        twitter: twitterLink,
        telegram: tgLink,
        kick: kickLink
    };

    const {imageUrl, metadataUri} = await uploadMetadata(imgFile, metadata);
    if (!imageUrl || !metadataUri)
        throw new Error("Failed to upload metadata!");

    const [metadataPDA] = await PublicKey.findProgramAddress(
        [
            Buffer.from("metadata"), 
            PROGRAM_ID.toBuffer(), 
            mint.toBuffer()
        ], 
        PROGRAM_ID
    );
    // console.log(`  Got metadataAccount address: ${metadataPDA}`);

    // on-chain metadata format
    const tokenMetadata = {
        name, 
        symbol, 
        uri: metadataUri, 
        sellerFeeBasisPoints: 0, 
        creators: null, 
        collection: null, 
        uses: null
    };

    // transaction to create metadata account
    const ix = createCreateMetadataAccountV3Instruction({
            metadata: metadataPDA, 
            mint, 
            mintAuthority, 
            payer: walletCtx.publicKey, 
            updateAuthority
        }, {
            createMetadataAccountArgsV3: {
                data: tokenMetadata, 
                isMutable: true, 
                collectionDetails: null
            }
        }
    );

    return {imageUrl, ix};
};

const revokeMintAuthority = async(mint, mintAuthority) => {
    // console.log(`Revoking mintAuthority of token ${mint}...`);

    const ix = createSetAuthorityInstruction(mint, 
        mintAuthority, 
        AuthorityType.MintTokens, 
        null
    );

    return ix;
};


export const createToken = async(walletCtx, name, ticker, description, imgBuffer, imgFile, websiteLink, twitterLink, tgLink, kickLink) => {
    // console.log(`${walletCtx.publicKey.toBase58()} is creating a new token with name: '${name}', ticker: '${ticker}', description: '${description}'`);
    // console.log(`  website: '${websiteLink}', twitterLink: '${twitterLink}', telegramLink: '${tgLink}'...`);

    try {
        let createIxs = [];

        /* Step 1 - Create mint (feeAuthority disabled) */
        const { keypair: mintKeypair , ixs: createMintIxs } = await createMint(walletCtx.publicKey, null, TOKEN_DECIMALS);
        createIxs = createMintIxs;
        // console.log('  mint:', mintKeypair.publicKey.toBase58());

        /* Step 2 - Create metadata */
        const {imageUrl, ix: metadataIx} = await createMetadata(
            walletCtx, 
            mintKeypair.publicKey, 
            name, ticker, description, 
            imgBuffer, imgFile, 
            websiteLink, twitterLink, tgLink, kickLink, 
            walletCtx.publicKey, walletCtx.publicKey
        );
        createIxs.push(metadataIx);
        
        /* Step 3 - Mint tokens to owner */
        const mintIxs = await mintToken(mintKeypair.publicKey, walletCtx.publicKey, BigInt(TOKEN_TOTAL_SUPPLY), TOKEN_DECIMALS);
        createIxs = [...createIxs, ...mintIxs];

        /* Step 4 - Revoke mintAuthority */
        const revokeIx = await revokeMintAuthority(mintKeypair.publicKey, walletCtx.publicKey);
        createIxs.push(revokeIx);

        return { mintKeypair, imageUrl, createIxs };
    } catch (err) {
        console.error(`Failed to create token: ${err.message}`);
        throw new Error(`Failed to create token: ${err.message}`);
    }
};
