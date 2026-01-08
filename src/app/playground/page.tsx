import React from "react";

const page = () => {
  return (
    <>
      <div className="h-screen" />
      <div className="flex border justify-center">
        <div className="shader framed relative ">
          <img
            src="https://assets.codepen.io/2153413/sparrow-base.png"
            alt="Silhouette design of a sparrow sitting on a branch"
            width="300"
            className=""
          />
          <div className="shader-layer specular gradient-sparrow absolute inset-0">
            <img
              className="shader-layer mask z-50 "
              src="https://assets.codepen.io/2153413/sparrow-mask.png"
              alt=""
              width="300"
            />
          </div>
        </div>
      </div>
      <div className="h-screen" />
    </>
  );
};

export default page;
