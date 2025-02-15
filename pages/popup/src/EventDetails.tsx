import type { EventLog } from '@src/Popup';
import { useState } from 'react';

interface EventDetailsProps {
  event: EventLog | null;
}

export const EventDetails = ({ event }: EventDetailsProps) => {
  const [showRawJSON, setShowRawJSON] = useState(false);

  if (!event) {
    return <p className="px-[16px] py-[24px] text-center text-zinc-400">세부 정보를 확인하려면 이벤트를 선택하세요.</p>;
  }

  return (
    <div className="px-[16px] py-[24px] text-center text-zinc-100">
      <div className="flex items-center gap-x-[16px] mb-[24px]">
        <h3 className="text-[20px] font-bold flex-1">{event.data.event.amplitude.event_type}</h3>
        <label className="flex items-center gap-x-[4px] shrink-0 text-[14px] text-zinc-400 cursor-pointer">
          원본 JSON
          <input type="checkbox" checked={showRawJSON} onChange={e => setShowRawJSON(e.target.checked)} />
        </label>
      </div>

      {!showRawJSON && (
        <>
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
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(event.data.event.amplitude.event_properties, null, 2)}
          </pre>
          <h4 className="text-[16px] font-bold mt-[24px] mb-[8px]">User Properties</h4>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(event.data.event.amplitude.user_properties, null, 2)}
          </pre>
        </>
      )}

      {showRawJSON && (
        <pre className="text-zinc-100 text-start whitespace-pre-wrap">{JSON.stringify(event.data, null, 2)}</pre>
      )}
    </div>
  );
};
