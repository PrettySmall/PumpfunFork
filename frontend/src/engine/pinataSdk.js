import axios from 'axios'
const PINATA_JWT = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJhYTVmYjY3OC00NmNmLTQ2ZmItYmJmOC03MjgwODM4ZTIwYzQiLCJlbWFpbCI6InNlaWppaW9AbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiYzY0NmQ5ODc3M2QxMWVhNWVmNGMiLCJzY29wZWRLZXlTZWNyZXQiOiJkZjZjYmYyMWVkODFlNTI4ZGI0YWRhOTE3M2Y2ZjRiMWU2NjZiOTRiMDA1YTUxOThiMmRjZjhiZTU3M2RlYjMwIiwiZXhwIjoxNzY5OTc5NDY2fQ.eXYY-wH-__vYowgZkS4wgSoM9jeYMTD34pBF3Ua7TVc'

export const uploadMetadata = async(imgFile, metadata) => {
    try {
        let imageHash = ''
        const uploadImage = true
        if(uploadImage) {            
            const formData = new FormData();
            formData.append('file', imgFile)

            const pinataMetadata = JSON.stringify({
                name: 'File name',
            });
            formData.append('pinataMetadata', pinataMetadata);
            
            const pinataOptions = JSON.stringify({
                cidVersion: 0,
            })
            formData.append('pinataOptions', pinataOptions);

            try {
                const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
                    method: "POST",
                    headers: {
                        Authorization: `${PINATA_JWT}`,
                    },
                    body: formData,
                });
                const resData = await res.json();
                imageHash = resData.IpfsHash
            } catch (error) {
                console.log("File to IPFS: ")
                console.log(error)
            }            
        }
        const imageUrl = `https://ipfs.io/ipfs/${imageHash}`
        metadata.image = imageUrl
        
        let metadataUri = ''
        try {
            const res_2 = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: PINATA_JWT,
                },
                body: JSON.stringify(metadata),
            });
            const resData_2 = await res_2.json();
            console.log('resData_2:', resData_2)
            metadataUri = `https://ipfs.io/ipfs/${resData_2.IpfsHash}`
            
        } catch (error) {
            console.log('res_2->error:', error)
            return ''
        }

        return {
            imageUrl,
            metadataUri
        }
    } catch (error) {
        console.log('pinataSdk.js -> Error: ', error)
    }
    return ''
}