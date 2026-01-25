import { GithubIcon, SolidJSIcon } from "./icons";
import s from "./Heading.module.css";

export default function Heading() {
  return (
    <>
      <div class={s.Heading}>
        <h1>Solid JS Search Bar</h1>
        <div>
          powered by{" "}
          <a
            href="https://typesense.org/"
            target="_blank"
            rel="noopener noreferrer"
            class={s.typesense}
          >
            type<b>sense</b>|
          </a>{" "}
          & <SolidJSIcon class={s.solidJSLogo} />
        </div>
      </div>
      <a
        href="https://github.com/typesense/code-samples/typesense-solid-js-search"
        target="_blank"
        rel="noopener noreferrer"
        class={s.githubLink}
        title="Github repo"
      >
        <GithubIcon />
      </a>
    </>
  );
}
