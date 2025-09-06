import 'webextension-polyfill';

const events: unknown[] = [];

// kinesis로 이벤트가 전송될 때마다 가로채서 이벤트를 추출한다.
chrome.webRequest.onBeforeRequest.addListener(
  details => {
    const event = getEventLogFromRequestBody(details);
    if (event) {
      events.push(event);
      chrome.runtime.sendMessage({ type: 'UPDATE_EVENTS', events });
      updateCountBadge();
    }
  },
  {
    urls: ['https://*.lfind.kr/*', 'https://lfind.kr/*', 'https://*.lbox.kr/*', 'https://lbox.kr/*'],
    types: ['xmlhttprequest'],
  },
  ['requestBody'],
);

// 팝업에서 이벤트를 조회
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'GET_EVENTS') {
    sendResponse(events);
  }
});

// 팝업에서 이벤트 로그를 초기화
chrome.runtime.onMessage.addListener(message => {
  if (message?.type === 'CLEAR_EVENTS') {
    events.length = 0;
    chrome.runtime.sendMessage({ type: 'UPDATE_EVENTS', events });
    updateCountBadge();
  }
});

function getEventLogFromRequestBody(details: chrome.webRequest.WebRequestBodyDetails) {
  if (details.method === 'POST' && details.requestBody) {
    const arrayBuffer = details.requestBody.raw?.[0]?.bytes;

    if (!arrayBuffer) {
      return null;
    }

    try {
      const textDecoder = new TextDecoder();
      const decodedString = textDecoder.decode(arrayBuffer);
      const kinesisJson = JSON.parse(decodedString) as { deviceId: string; log: string; streamName: string };

      // kinesisJson가 올바른 형식인지 확인
      if (
        !Object.hasOwn(kinesisJson, 'deviceId') ||
        !Object.hasOwn(kinesisJson, 'log') ||
        !Object.hasOwn(kinesisJson, 'streamName')
      ) {
        return null;
      }

      const rawEvent = JSON.parse(kinesisJson.log);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rawEvent.event = JSON.parse(rawEvent.event as any);

      return rawEvent;
    } catch {
      return null;
    }
  }
  return null;
}

function updateCountBadge() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0]) {
      chrome.action.setBadgeText({ text: events.length > 0 ? String(events.length) : '', tabId: tabs[0].id });
    }
  });
}
