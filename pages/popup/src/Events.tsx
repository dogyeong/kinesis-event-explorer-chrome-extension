import type { EventLog } from '@src/Popup';

interface EventsProps {
  events: EventLog[];
  selectedEventId: string | null;
  onClickEvent: (id: string) => void;
}

export const Events = ({ events, onClickEvent, selectedEventId }: EventsProps) => {
  if (events.length === 0) {
    return <p className="px-[16px] py-[24px] text-center text-zinc-400">이벤트가 없습니다.</p>;
  }

  return (
    <ul className="">
      {events
        .sort((a, b) => b.data.date - a.data.date)
        .map(({ id, date, data }) => (
          <li key={id} className="[&:not(:last-of-type)]:border-b-zinc-600 [&:not(:last-of-type)]:border-b-[0.5px]">
            <button
              type="button"
              className={
                'p-[16px] cursor-pointer flex gap-x-[12px] items-center w-full' +
                ' ' +
                (selectedEventId === id ? 'bg-zinc-700' : '')
              }
              onClick={() => onClickEvent(id)}>
              <time dateTime={date.toLocaleDateString()} className="text-zinc-400 shrink-0 text-[12px]">
                {date.toLocaleTimeString()}
              </time>
              <p className="text-zinc-100 break-all text-pretty text-[16px] text-start">
                {String(data.event.amplitude.event_type)}
              </p>
            </button>
          </li>
        ))}
    </ul>
  );
};
