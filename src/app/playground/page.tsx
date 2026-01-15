import React from "react";
import TextMatrixRain from "registry/new-york/text/text-matrix-rain";

const CardAnimation = () => {
  return (
    <div className=" max-w-md w-full border rounded-3xl p-7 ">
      <TextMatrixRain className="text-xs"> AI SAAS CARD</TextMatrixRain>
      <h1 className="mt-2 text-xl  font-light">
        Built for Pros AI Orchestrators
      </h1>
      <h2 className="mt-3 text-sm">
        Officia pariatur id occaecat dolore ea amet nostrud enim. Officia non
        elit proident non veniam proident. Elit deserunt irure nisi ullamco.
        Elit mollit do irure.
      </h2>

      <section className="mt-10">
        <div className=" w-[90%] h-40 border rounded-2xl"></div>
        <div></div>
        <div></div>
      </section>
    </div>
  );
};

export default CardAnimation;
