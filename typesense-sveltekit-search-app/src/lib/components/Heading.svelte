<script lang="ts">
  import GithubIcon from './GithubIcon.svelte';
  import SvelteLogo from './SvelteLogo.svelte';
</script>

<div class="Heading">
  <h1>SvelteKit Search Bar</h1>
  <div class="powered-by">
    powered by{' '}
    <a
      href="https://typesense.org/"
      target="_blank"
      rel="noopener noreferrer"
      class="typesense"
    >
      type<b>sense</b>|
    </a>{' '}
    & <span class="sveltejs-brand"><SvelteLogo class="svelteLogo" /> SvelteKit</span>
  </div>
</div>

<a
  href="https://github.com/typesense/code-samples/tree/master/typesense-sveltekit-search-app"
  target="_blank"
  rel="noopener noreferrer"
  class="githubLink"
  title="Github repo"
>
  <GithubIcon />
</a>

<style>
.Heading {
  width: 100%;
  text-align: center;
  position: relative;
  isolation: isolate;
  margin-top: 6rem;
  margin-bottom: 2rem;
}

.Heading h1 {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
}

.powered-by {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  font-size: clamp(0.875rem, 2vw, 1rem);
  color: #4b5563;
}

.typesense {
  color: #d52b7f;
  text-decoration: none;
  font-family: monospace;
}

.typesense:hover {
  text-decoration: underline;
}

.Heading::after {
  content: "";
  background: conic-gradient(
    from 180deg at 50% 50%,
    #ed0e73 0deg,
    rgba(10, 133, 255, 0.2) 55deg,
    rgba(84, 214, 255, 0.2) 140deg,
    rgba(0, 220, 128, 0.41) 160deg,
    transparent 360deg
  );
  width: 320px;
  height: 180px;
  z-index: -1;
  left: 50%;
  transform: translateX(-50%);
  position: absolute;
  filter: blur(45px);
  top: -50%;
  animation: move 40s ease-out infinite;
  pointer-events: none;
  will-change: transform;
}

.sveltejs-brand {
  display: inline-flex;
  align-items: center;
  font-weight: 700;
  color: #ff3e00;
}

:global(.svelteLogo) {
  width: clamp(18px, 2.5vw, 24px);
  height: auto;
  position: relative;
  margin-right: 0.25rem;
  vertical-align: middle;
}

.githubLink {
  position: fixed;
  top: 2rem;
  right: 2rem;
  color: #333;
  transition: color 0.2s ease;
  z-index: 50;
}

.githubLink:hover {
  color: #000;
}

:global(.githubLink svg) {
  width: 28px;
  height: 28px;
}

@keyframes move {
  0% {
    transform: translateX(-50%) translate(0%) scale(1);
  }
  45% {
    transform: translateX(-50%) translate(-40%, 20%) scale(1.2);
  }
  75% {
    transform: translateX(-50%) translate(5%, 40%) scale(1.3);
  }
  90% {
    transform: translateX(-50%) translate(-5%, 5%) scale(0.9);
  }
  100% {
    transform: translateX(-50%) translate(0%) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .Heading::after {
    animation: none;
  }
}
</style>
