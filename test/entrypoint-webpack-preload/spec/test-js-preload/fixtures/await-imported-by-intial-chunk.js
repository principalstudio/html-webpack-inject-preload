export async function awaitImportByInitialChunk() {
    const { awaitImportByAsyncChunk } = await import('./await-imported-by-async-chunk');
    awaitImportByAsyncChunk();
}