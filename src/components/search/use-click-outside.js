import { useEffect } from 'react';

const events = ['mousedown', 'touchstart'];

export default (ref, onClickOutside) => {
  const isOutside = (element) => !ref.current || !ref.current.contains(element);

  const onClick = (event) => {
    if (isOutside(event.target)) {
      onClickOutside();
    }
  };

  useEffect(() => {
    events.map((event) => (
      document.addEventListener(event, onClick)
    ));

    return () => {
      events.map((event) => document.removeEventListener(event, onClick));
    };
  });
};
