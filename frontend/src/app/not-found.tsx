"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";

const doodles = [
  {
    className: "left-[8%] top-[12%] w-20 md:w-28 rotate-[-8deg]",
    depth: 24,
    svg: (
      <svg viewBox="0 0 120 70" className="h-auto w-full" fill="none">
        <path
          d="M12 53C28 45 44 37 61 28C76 20 88 13 106 12"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M88 9C95 12 101 19 104 27"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M88 8C95 9 104 11 111 16"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    className: "right-[10%] top-[18%] w-16 md:w-24 rotate-[10deg]",
    depth: 18,
    svg: (
      <svg viewBox="0 0 100 100" className="h-auto w-full" fill="none">
        <path
          d="M23 49C29 30 48 19 66 20C81 22 93 38 82 58C73 76 47 82 29 70C15 60 18 38 30 28"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M71 72L87 88"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    className: "left-[12%] bottom-[18%] w-16 md:w-24 rotate-[-6deg]",
    depth: 20,
    svg: (
      <svg viewBox="0 0 100 100" className="h-auto w-full" fill="none">
        <path
          d="M49 8C57 21 58 33 56 46C54 60 49 75 49 91"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M46 97C44 87 55 84 58 91C60 97 56 103 49 102C42 101 40 95 44 91"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    className: "right-[12%] bottom-[20%] w-24 md:w-32 rotate-[7deg]",
    depth: 28,
    svg: (
      <svg viewBox="0 0 140 110" className="h-auto w-full" fill="none">
        <path
          d="M20 60C39 43 58 31 84 27C96 25 108 25 121 28"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M91 18C104 22 117 31 124 40"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M90 17C97 28 100 42 97 57"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function NotFound() {
  const rootRef = useRef<HTMLElement>(null);
  const sketchRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const sketch = sketchRef.current;
    const button = buttonRef.current;

    if (!root || !sketch || !button) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ctx = gsap.context(() => {
      const drawPaths = gsap.utils.toArray<SVGPathElement>("[data-draw]");
      const revealItems = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      const doodleItems = gsap.utils.toArray<HTMLElement>("[data-doodle]");
      const shakyItems = gsap.utils.toArray<HTMLElement>("[data-jitter]");

      drawPaths.forEach((path) => {
        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length}`;
      });

      if (prefersReducedMotion) {
        gsap.set(drawPaths, { strokeDashoffset: 0 });
        gsap.set(revealItems, { opacity: 1, y: 0, rotate: 0 });
        return;
      }

      gsap.set(revealItems, { opacity: 0, y: 18, rotate: -1.5 });

      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

      intro
        .to(drawPaths, {
          strokeDashoffset: 0,
          duration: 1.3,
          stagger: 0.08,
        })
        .to(
          revealItems,
          {
            opacity: 1,
            y: 0,
            rotate: 0,
            duration: 0.8,
            stagger: 0.12,
          },
          "-=0.75",
        );

      gsap.to(sketch, {
        y: -8,
        duration: 2.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      doodleItems.forEach((item, index) => {
        gsap.to(item, {
          y: index % 2 === 0 ? -7 : 8,
          x: index % 2 === 0 ? 4 : -5,
          rotate: index % 2 === 0 ? 2 : -2,
          duration: 2.2 + index * 0.25,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      shakyItems.forEach((item, index) => {
        gsap.to(item, {
          x: `random(-0.9, 0.9)`,
          y: `random(-0.8, 0.8)`,
          rotate: `random(-0.7, 0.7)`,
          duration: 0.22 + index * 0.03,
          repeat: -1,
          yoyo: true,
          ease: "none",
        });
      });
    }, root);

    const parallaxTargets = Array.from(
      root.querySelectorAll<HTMLElement>("[data-depth]"),
    );

    const handleMouseMove = (event: MouseEvent) => {
      if (prefersReducedMotion) {
        return;
      }

      const rect = root.getBoundingClientRect();
      const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
      const offsetY = (event.clientY - rect.top) / rect.height - 0.5;

      parallaxTargets.forEach((item) => {
        const depth = Number(item.dataset.depth ?? 12);
        gsap.to(item, {
          x: offsetX * depth,
          y: offsetY * depth * 0.75,
          duration: 0.55,
          ease: "power3.out",
        });
      });
    };

    const handleMouseLeave = () => {
      if (prefersReducedMotion) {
        return;
      }

      parallaxTargets.forEach((item) => {
        gsap.to(item, {
          x: 0,
          y: 0,
          duration: 0.7,
          ease: "expo.out",
        });
      });
    };

    const handleButtonEnter = () => {
      if (prefersReducedMotion) {
        return;
      }

      gsap.to(button, {
        scale: 1.04,
        rotate: -1.5,
        duration: 0.25,
        ease: "power3.out",
      });
      gsap.to(button.querySelector("[data-button-outline]"), {
        x: 2,
        y: -2,
        rotate: 1.4,
        duration: 0.28,
        ease: "power3.out",
      });
    };

    const handleButtonLeave = () => {
      if (prefersReducedMotion) {
        return;
      }

      gsap.to(button, {
        scale: 1,
        rotate: 0,
        duration: 0.3,
        ease: "power3.out",
      });
      gsap.to(button.querySelector("[data-button-outline]"), {
        x: 0,
        y: 0,
        rotate: 0,
        duration: 0.3,
        ease: "power3.out",
      });
    };

    root.addEventListener("mousemove", handleMouseMove);
    root.addEventListener("mouseleave", handleMouseLeave);
    button.addEventListener("mouseenter", handleButtonEnter);
    button.addEventListener("mouseleave", handleButtonLeave);
    button.addEventListener("focus", handleButtonEnter);
    button.addEventListener("blur", handleButtonLeave);

    return () => {
      root.removeEventListener("mousemove", handleMouseMove);
      root.removeEventListener("mouseleave", handleMouseLeave);
      button.removeEventListener("mouseenter", handleButtonEnter);
      button.removeEventListener("mouseleave", handleButtonLeave);
      button.removeEventListener("focus", handleButtonEnter);
      button.removeEventListener("blur", handleButtonLeave);
      ctx.revert();
    };
  }, []);

  return (
    <main
      ref={rootRef}
      className="relative min-h-screen overflow-hidden px-6 py-12 text-[#2f2a24]"
      style={{
        backgroundColor: "#f4ecd8",
        backgroundImage: [
          "radial-gradient(circle at 20% 20%, rgba(80, 72, 60, 0.08) 0, transparent 24%)",
          "radial-gradient(circle at 80% 12%, rgba(80, 72, 60, 0.05) 0, transparent 20%)",
          "repeating-linear-gradient(0deg, rgba(120, 104, 84, 0.04), rgba(120, 104, 84, 0.04) 1px, transparent 1px, transparent 34px)",
          "repeating-linear-gradient(90deg, rgba(120, 104, 84, 0.025), rgba(120, 104, 84, 0.025) 1px, transparent 1px, transparent 42px)",
        ].join(", "),
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-35 mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.18'/%3E%3C/svg%3E\")",
        }}
      />

      {doodles.map((doodle) => (
        <div
          key={doodle.className}
          data-doodle
          data-depth={doodle.depth}
          aria-hidden="true"
          className={`pointer-events-none absolute text-[#74685a] opacity-75 ${doodle.className}`}
        >
          {doodle.svg}
        </div>
      ))}

      <section className="relative mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div
            ref={sketchRef}
            data-depth="16"
            className="relative mx-auto w-full max-w-3xl"
          >
            <div
              aria-hidden="true"
              className="absolute inset-x-6 top-10 h-[78%] -rotate-[1.5deg] rounded-[42px] border border-[#b6a894]/50"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-2 top-6 h-[82%] rotate-[1.25deg] rounded-[50px] border border-[#c9bca8]/70"
            />

            <div className="relative rounded-[2.2rem] border border-[#b7ab97] bg-[#f7f0df]/90 px-5 py-7 shadow-[6px_7px_0_rgba(79,66,53,0.08)] md:px-8 md:py-10">
              <svg
                viewBox="0 0 900 430"
                className="h-auto w-full"
                role="img"
                aria-label="Hand-drawn 404 illustration"
                fill="none"
                stroke="#3f372f"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <g data-jitter>
                  <path
                    data-draw
                    d="M82 240L184 72L191 366"
                    strokeWidth="12"
                  />
                  <path
                    data-draw
                    d="M54 244L255 242"
                    strokeWidth="12"
                  />
                </g>

                <g data-jitter>
                  <path
                    data-draw
                    d="M356 113C401 70 497 70 542 114C581 154 590 254 546 311C504 365 409 366 364 321C324 280 316 170 356 113Z"
                    strokeWidth="12"
                  />
                  <path
                    data-draw
                    d="M382 137C414 109 486 108 520 138C552 166 559 252 523 290C489 325 420 328 387 298C355 269 348 168 382 137Z"
                    strokeWidth="4"
                    opacity="0.55"
                  />
                </g>

                <g data-jitter>
                  <path
                    data-draw
                    d="M646 240L748 72L755 366"
                    strokeWidth="12"
                  />
                  <path
                    data-draw
                    d="M618 244L819 242"
                    strokeWidth="12"
                  />
                </g>

                <path
                  data-draw
                  d="M132 63C149 50 171 49 188 59"
                  strokeWidth="3.5"
                  opacity="0.45"
                />
                <path
                  data-draw
                  d="M408 47C458 30 515 34 552 65"
                  strokeWidth="3.5"
                  opacity="0.45"
                />
                <path
                  data-draw
                  d="M696 65C719 47 742 47 763 59"
                  strokeWidth="3.5"
                  opacity="0.45"
                />
                <path
                  data-draw
                  d="M289 367C343 383 562 383 615 367"
                  strokeWidth="3"
                  opacity="0.38"
                />
              </svg>

              <div
                data-reveal
                className="mt-4 flex items-center justify-center gap-3 text-[0.72rem] uppercase tracking-[0.34em] text-[#7b6e60]"
                style={{ fontFamily: '"Courier New", monospace' }}
              >
                <span className="inline-block -rotate-2">oops</span>
                <span className="inline-block h-px w-10 bg-[#8c7f70]/60" />
                <span className="inline-block rotate-2">wrong page</span>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div
              data-reveal
              data-depth="8"
              className="relative -rotate-[1.2deg] rounded-[1.8rem] border border-[#b4a58d] bg-[#f8f2e4]/95 px-6 py-8 shadow-[7px_8px_0_rgba(91,76,60,0.08)] md:px-8"
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-4 top-5 h-[calc(100%-2.5rem)] rotate-[1.2deg] rounded-[1.6rem] border border-[#d3c6b0]/75"
              />

              <p
                className="relative text-sm text-[#7b6f61]"
                style={{ fontFamily: '"Courier New", monospace' }}
              >
                notebook note:
              </p>
              <h1
                className="relative mt-3 text-4xl leading-none text-[#312922] md:text-5xl"
                style={{
                  fontFamily: '"Comic Sans MS", "Bradley Hand", "Segoe Print", cursive',
                }}
              >
                Page Not Found
              </h1>
              <p
                className="relative mt-5 text-lg leading-8 text-[#4e453c]"
                style={{
                  fontFamily: '"Comic Sans MS", "Bradley Hand", "Segoe Print", cursive',
                }}
              >
                Looks like this page wandered off the sketchbook. The trail
                ends here, but we can still get you back home.
              </p>

              <div className="relative mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link
                  ref={buttonRef}
                  href="/"
                  aria-label="Go to the home page"
                  className="relative inline-flex min-h-14 items-center justify-center px-7 py-3 text-lg text-[#312922] outline-none focus-visible:ring-2 focus-visible:ring-[#6a5c4d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4ecd8]"
                  style={{
                    fontFamily:
                      '"Comic Sans MS", "Bradley Hand", "Segoe Print", cursive',
                  }}
                >
                  <span className="relative z-10 inline-block -rotate-[1.4deg]">
                    Go Home
                  </span>
                  <svg
                    data-button-outline
                    aria-hidden="true"
                    viewBox="0 0 220 74"
                    className="absolute inset-0 h-full w-full overflow-visible"
                    fill="none"
                    stroke="#433a31"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path
                      d="M12 17C42 10 177 8 204 17C213 20 212 54 202 58C176 67 44 66 15 58C7 55 7 24 12 17Z"
                      strokeWidth="2.7"
                    />
                    <path
                      d="M16 14C47 8 180 8 207 18"
                      strokeWidth="1.9"
                      opacity="0.65"
                    />
                    <path
                      d="M18 59C46 64 176 66 200 57"
                      strokeWidth="1.8"
                      opacity="0.55"
                    />
                  </svg>
                </Link>

                <div
                  data-reveal
                  data-depth="10"
                  className="text-[#6f6458]"
                  style={{
                    fontFamily:
                      '"Comic Sans MS", "Bradley Hand", "Segoe Print", cursive',
                  }}
                >
                  <p className="text-sm">Error code: 404</p>
                  <p className="mt-1 text-sm rotate-1">
                    try the front door instead
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
