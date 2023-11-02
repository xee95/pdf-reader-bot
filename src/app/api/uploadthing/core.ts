import { db } from '@/db'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import {
  createUploadthing,
  type FileRouter,
} from 'uploadthing/next'
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'

import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { PineconeStore } from 'langchain/vectorstores/pinecone'
import {  pinecone } from '@/lib/pincone'
// import { getPineconeClient } from '@/lib/pincone'

const f = createUploadthing()



export const ourFileRouter = {
  imageuploader: f({ pdf: { maxFileSize: '4MB' } })
    .middleware(async ({req, res}) => {
      const { getUser } = getKindeServerSession()
      const user = getUser()
      if(!user || !user.id) throw new Error('Unauthorized')
      
        return {userId : user.id}
    })
    .onUploadComplete(async({metadata,file})=>{
        const createdFile = await db.file.create({
            data: {
              key: file.key,
              name: file.name,
              userId: metadata.userId,
              url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
              uploadStatus: 'PROCESSING',
            },
          })

          try {
            const response = await fetch(
              `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`
            )

            const blob = await response.blob()

    const loader = new PDFLoader(blob)

    const pageLevelDocs = await loader.load()
     pageLevelDocs[0].metadata.fileId = createdFile.id

    const pagesAmt = pageLevelDocs.length


    // const pinecone = await getPineconeClient()
    const pineconeIndex = pinecone.Index('pdfreader')
    console.log("emmbaedding1")
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    })

    console.log("emmbaedding")
    await PineconeStore.fromDocuments(
      pageLevelDocs,
      embeddings,
      {
       // @ts-ignore
        pineconeIndex,
        // namespace: createdFile.id,
      }
    )

    await db.file.update({
      data: {
        uploadStatus: 'SUCCESS',
      },
      where: {
        id: createdFile.id,
      },
    })
          }
          catch(err){
            console.log(err)
            // await db.file.update({
            //   data: {
            //     uploadStatus: 'FAILED',
            //   },
            //   where: {
            //     id: createdFile.id,
            //   },
            // })
          }
    }),
    
  
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter