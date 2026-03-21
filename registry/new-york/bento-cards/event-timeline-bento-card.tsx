const EventTimelineBentoCard = () => {
  return (
    <div className="w-md border border p-4 flex flex-col">
      <img
        className="dark:invert-75"
        src="/card.png"
        alt="Event timeline card preview"
      />
      <h1 className="text-sm  font-medium mt-4">Event Timeline</h1>
      <span className="text-sm text-muted-foreground line-clamp-2 leading-tight">
        All signals and events flow into a single timeline, giving you a clear
        history of everything that happens.
      </span>
    </div>
  );
};

export default EventTimelineBentoCard;
