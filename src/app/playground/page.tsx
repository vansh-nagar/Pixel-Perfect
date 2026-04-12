"use client";

import { useState } from "react";
import useMeasure from "react-use-measure";
import LiquidGlassButton from "registry/new-york/buttons/liquid-glass-button";

const Page = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [contentRef, contentBounds] = useMeasure();
  const [content2Ref, content2Bounds] = useMeasure();
  const openHeight = Math.max(
    40,
    Math.ceil(contentBounds.height + content2Bounds.height),
  );

  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-full">
      <LiquidGlassButton />
      hi my name is vansh :)
      {/* <div className="flex justify-center items-start w-md h-[400px] ">
        <motion.div
          transition={{
            type: "spring",
            damping: 34,
            stiffness: 380,
            mass: 0.8,
          }}
          onClick={() => setIsOpen(!isOpen)}
          animate={{
            width: isOpen ? 220 : "auto",
            height: isOpen ? openHeight : 40,
          }}
          className="border overflow-hidden relative cursor-pointer"
        >
          <motion.div
            ref={content2Ref}
            className="=flex items-center justify-center p-2"
            style={{ pointerEvents: isOpen ? "none" : "auto" }}
          >
            {isOpen ? <FolderOpen /> : <FolderClosed />}
          </motion.div>

          <div ref={contentRef}>
            <motion.div
              animate={{ opacity: isOpen ? 1 : 0 }}
              className="flex flex-col p-2"
              style={{ pointerEvents: isOpen ? "auto" : "none" }}
            >
              <div>Profile</div>
              <div>Settings</div>
              <div>Billing</div>
              <div className="mt-2 text-destructive flex justify-end">
                Logout
              </div>
            </motion.div>
          </div>
        </motion.div>{" "}
      </div> */}
    </div>
  );
};

export default Page;
