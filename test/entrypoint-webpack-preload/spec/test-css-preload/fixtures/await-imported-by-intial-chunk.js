import './await-imported-by-intial-chunk.css';
export async function awaitImportByInitialChunk() {
    const { awaitImportByAsyncChunk } = await import('./await-imported-by-async-chunk');
    awaitImportByAsyncChunk();
}