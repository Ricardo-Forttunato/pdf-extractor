import { Container } from "@mui/material";
import { UploadForm } from "@/components/upload/upload-form";
export default function Home() {
  return (
    <Container sx={{ py: 6 }}>
      <UploadForm />
    </Container>
  );
}
