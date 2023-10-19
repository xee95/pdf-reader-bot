
interface PageProps {
    params: {
        fileId: string;
    };
}

const Page= ({params}: PageProps) => {

    const {fileId} = params;
    return ( 
        <div>
            {fileId}
        </div>
     );
}
 
export default Page
;