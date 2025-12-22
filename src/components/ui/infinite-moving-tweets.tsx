"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

interface Tweet {
  avatar: string;
  name: string;
  username: string;
  content: string;
  link?: string;
}

export const InfiniteMovingTweets = ({
  tweets,
  direction = "up",
  speed = "normal",
  pauseOnHover = true,
  className,
}: {
  tweets: Tweet[];
  direction?: "up" | "down";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    addAnimation();
  }, []);

  const [start, setStart] = useState(false);

  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);

      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });

      getDirection();
      getSpeed();
      setStart(true);
    }
  }

  const getDirection = () => {
    if (containerRef.current) {
      if (direction === "up") {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "forwards"
        );
      } else {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "reverse"
        );
      }
    }
  };

  const getSpeed = () => {
    if (containerRef.current) {
      if (speed === "fast") {
        containerRef.current.style.setProperty("--animation-duration", "20s");
      } else if (speed === "normal") {
        containerRef.current.style.setProperty("--animation-duration", "40s");
      } else {
        containerRef.current.style.setProperty("--animation-duration", "80s");
      }
    }
  };

  // Function to render tweet content with highlighted mentions
  const renderContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        return (
          <span key={index} className=" font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller-vertical relative overflow-hidden h-full",
        className
      )}
    >
      <div
        ref={scrollerRef}
        className={cn(
          "flex flex-col py-4",
          start && "animate-scroll-vertical",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {tweets.map((tweet, index) => (
          <TweetCard key={index} tweet={tweet} renderContent={renderContent} />
        ))}
      </div>
    </div>
  );
};

const TweetCard = ({
  tweet,
  renderContent,
}: {
  tweet: Tweet;
  renderContent: (content: string) => React.ReactNode;
}) => {
  return (
    <div className="relative border-b rounded-none p-4 w-full shrink-0 border-r border-muted">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <img
            src={tweet.avatar}
            alt={tweet.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="ml-3">
            <p className="font-semibold text-sm">{tweet.name}</p>
            <p className="text-xs text-muted-foreground">{tweet.username}</p>
          </div>
        </div>
        {tweet.link && (
          <a
            href={tweet.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17L17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </a>
        )}
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed">{renderContent(tweet.content)}</p>
    </div>
  );
};

export default InfiniteMovingTweets;
