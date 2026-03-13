import { GithubIcon, QwikLogo } from "./icons";

export default function Heading() {
  return (
    <>
      <div class="heading-wrapper">
        <h1>Qwik Search Bar</h1>
        <div>
          powered by{" "}
          <a
            href="https://typesense.org/"
            target="_blank"
            rel="noopener noreferrer"
            id="typesense"
          >
            type<b>sense</b>|
          </a>{" "}
          & <QwikLogo id="qwikLogo" />
        </div>
      </div>
      <a
        href="https://github.com/typesense/code-samples/typesense-qwik-js-search"
        target="_blank"
        rel="noopener noreferrer"
        class="fixed top-8 right-8 text-gray-700 hover:text-black transition-colors duration-200"
        title="Github repo"
      >
        <GithubIcon class="w-7 h-7" />
      </a>
    </>
  );
}
