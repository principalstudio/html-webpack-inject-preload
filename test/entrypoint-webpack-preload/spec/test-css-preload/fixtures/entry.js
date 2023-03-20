async function main() {
    const { awaitImportByInitialChunk } = await import(/* webpackPreload: true */ './await-imported-by-intial-chunk');
    awaitImportByInitialChunk();
}

main();