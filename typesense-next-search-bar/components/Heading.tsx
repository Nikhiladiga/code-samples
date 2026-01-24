import { GithubIcon, NextJSIcon } from "./icons";
import s from "./Heading.module.css";

export default function Heading() {
  return (
    <>
      <div className={s.Heading}>
        <h1>Next.js Search Bar</h1>
        <div>
          powered by{" "}
          <a
            href="https://typesense.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={s.typesense}
          >
            type<b>sense</b>|
          </a>{" "}
          & <NextJSIcon className={s.nextjsLogo} />
        </div>
      </div>
      <a
        href="https://github.com/typesense/code-samples/typesense-next-search-bar"
        target="_blank"
        rel="noopener noreferrer"
        className={s.githubLink}
        title="Github repo"
      >
        <GithubIcon />
      </a>
    </>
  );
}
