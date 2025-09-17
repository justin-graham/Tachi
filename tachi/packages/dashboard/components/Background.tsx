import { useEffect, useRef } from "react";

export default function Background() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bg = bgRef.current;
    if (!bg) return;

    const windowWidth = window.innerWidth / 5;
    const windowHeight = window.innerHeight / 5;

    const onMouseMove = (e: MouseEvent) => {
      const mouseX = e.clientX / windowWidth;
      const mouseY = e.clientY / windowHeight;
      bg.style.transform = `translate3d(-${mouseX}%, -${mouseY}%, 0)`;
    };

    document.addEventListener("mousemove", onMouseMove);
    return () => document.removeEventListener("mousemove", onMouseMove);
  }, []);

  return <div className="background-image" ref={bgRef} />;
}