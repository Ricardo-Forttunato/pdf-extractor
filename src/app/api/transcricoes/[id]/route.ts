import { updateRequestSchema } from "@/schemas/http";
import { updateTranscription } from "@/application/commands/update-transcription";
import { transcriptionStore } from "@/infrastructure/storage/in-memory-transcription-store";
export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const result = transcriptionStore.response(id); return result ? Response.json(result) : Response.json({ erro: "Transcrição não encontrada." }, { status: 404 }); }
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const job = transcriptionStore.get(id); if (!job) return Response.json({ erro: "Transcrição não encontrada." }, { status: 404 }); try { const body = updateRequestSchema.parse(await request.json()); updateTranscription(id, job.tipo, body.value); return new Response(null, { status: 204 }); } catch (cause) { return Response.json({ erro: cause instanceof Error ? cause.message : "A correção é inválida." }, { status: 400 }); } }
