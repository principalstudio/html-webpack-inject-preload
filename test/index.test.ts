import HtmlWebpackInjectPreload from '../src/main';

const options: HtmlWebpackInjectPreload.Options = {
  files: [
    {
      match: /.*\.woff2/,
      attributes: {
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        crossorigin: true,
      },
    },
    {
      match: /.*\.css/,
      attributes: {rel: 'preload', as: 'style', href: 'test-alt.css'},
    },
    {
      match: /.*\.null/,
      attributes: {href: false},
    },
  ],
};

describe('HTMLWebpackInjectPreload', () => {
  it('generateLink', async () => {
    const expectCss = '<link rel="preload" as="style" href="test-alt.css">';
    const linkCss = new HtmlWebpackInjectPreload(options).generateLink(
        'test.css',
    );
    expect(linkCss).toBe(expectCss);

    const expectWoff2 =
        '<link href="test.woff2" rel="preload" as="font" type="font/woff2" crossorigin>';
    const linkWoff2 = new HtmlWebpackInjectPreload(options).generateLink(
        'test.woff2',
    );
    expect(linkWoff2).toBe(expectWoff2);

    const expectNull = false;
    const linkNull = new HtmlWebpackInjectPreload(options).generateLink(
        'test.null',
    );
    expect(linkNull).toBe(expectNull);
  });
});
