"use client";
const files = new Map<string, File>();
export const rememberPdf = (id: string, file: File) => files.set(id, file);
export const getPdf = (id: string) => files.get(id);
