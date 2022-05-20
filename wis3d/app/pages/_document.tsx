import NextDocument, { Html, Head, Main, NextScript, DocumentContext } from "next/document";
import { resetIds, Stylesheet, InjectionMode } from "@fluentui/react";

const bodyStyle = { margin: 0, width: "100vw", height: "100vh" };

interface IProps {
  styleTags: string;
}

const stylesheet = Stylesheet.getInstance();
stylesheet.setConfig({
  injectionMode: InjectionMode.none,
  namespace: "server"
});
stylesheet.reset();

export default class Document extends NextDocument<IProps> {
  static async getInitialProps(ctx: DocumentContext) {
    resetIds();
    const props = await NextDocument.getInitialProps(ctx);
    return { ...props, styleTags: stylesheet.getRules(true) };
  }

  render() {
    const { styleTags } = this.props;
    return (
      <Html lang="en">
        <Head>
          <style type="text/css" dangerouslySetInnerHTML={{ __html: styleTags }} />
        </Head>
        <body style={bodyStyle}>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
