import type { EventLog } from '@src/Popup';

interface EventDetailsProps {
  event: EventLog | null;
}

export const EventDetails = ({ event }: EventDetailsProps) => {
  if (!event) {
    return <p className="px-[16px] py-[24px] text-center text-zinc-400">세부 정보를 확인하려면 이벤트를 선택하세요.</p>;
  }

  return (
    <div className="px-[16px] py-[24px] text-center text-zinc-100">
      <h3 className="text-[20px] font-bold mb-[24px]">{event.data.event.amplitude.event_type}</h3>
      <ul className="grid grid-cols-[auto_1fr] gap-x-[12px]">
        {Object.entries(event.data.event.amplitude)
          .filter(([key]) => key !== 'event_properties' && key !== 'user_properties')
          .map(([key, value]) => (
            <li
              key={key}
              className="justify-between grid-cols-subgrid grid col-span-full border-b-zinc-600 border-b-[0.5px] py-[4px]">
              <span className="text-zinc-400">{key}</span>
              <span className="text-zinc-100">
                {value === null && 'null'}
                {typeof value !== 'object' && value}
                {value !== null && typeof value === 'object' && JSON.stringify(value)}
              </span>
            </li>
          ))}
      </ul>
      <h4 className="text-[16px] font-bold mt-[24px] mb-[8px]">Event Properties</h4>
      <p className="whitespace-pre-wrap">{JSON.stringify(event.data.event.amplitude.event_properties, null, 2)}</p>
      <h4 className="text-[16px] font-bold mt-[24px] mb-[8px]">User Properties</h4>
      <p className="whitespace-pre-wrap">{JSON.stringify(event.data.event.amplitude.user_properties, null, 2)}</p>
    </div>
  );
};
