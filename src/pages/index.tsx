import { type NextPage } from "next";
import Head from "next/head";

import { api } from "~/utils/api";

const Home: NextPage = () => {
  const hello = api.example.hello.useQuery({ text: "from the API!" });

  return (
    <>
      <Head>
        <title>Nicholas Griffin</title>
        <meta name="description" content="Nicholas Griffin's personal website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <h1>{hello.data ? hello.data.greeting : "Loading..."}</h1>
      </main>
    </>
  );
};

export default Home;
