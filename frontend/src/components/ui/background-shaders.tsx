"use client";

import { Warp } from "@paper-design/shaders-react";

export default function Wrapper() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <Warp
        width="100%"
        height="100%"
        proportion={0.45}
        softness={1}
        distortion={0.25}
        swirl={0.8}
        swirlIterations={10}
        shape="checks"
        shapeScale={0.1}
        scale={1}
        rotation={0}
        speed={1}
        colors={[
          "hsl(203, 100%, 62%)",
          "hsl(255, 100%, 72%)",
          "hsl(158, 99%, 59%)",
          "hsl(264, 100%, 61%)",
        ]}
      />
      {/* Dynamic bottom blend mask to mix transition smoothly into the 2nd section (Features) */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-b from-transparent via-[#fcfcfd]/50 to-[#fcfcfd] pointer-events-none" />
    </div>
  );
}
