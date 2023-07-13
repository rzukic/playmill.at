import { Box, Heading } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

const StopWatch = ({ time, counting }) => {
  const [displayedTime, setTime] = useState(time);
  let minutes = Math.floor(displayedTime / 60);
  let seconds = displayedTime - minutes * 60;
  const [interval, setIntervalValue] = useState(null);
  useEffect(() => {
    if (counting && time > 0) {
      setIntervalValue(
        setInterval(() => {
          setTime((prevTime) => prevTime - 1);
        }, 1000)
      );
    }
    if (!counting) {
      clearInterval(interval);
    }
  }, [counting]);
  useEffect(() => {
    setTime(time);
  }, [time]);
  return (
    <Heading
      size='md'
      fontWeight='bold'
      color={counting ? 'red.500' : 'white'}
      borderRadius='md'
      p='1'
      bg='black'
    >
      0{minutes}:{Math.ceil(seconds) < 10 ? '0' : ''}
      {Math.ceil(seconds)}
    </Heading>
  );
};

export default StopWatch;
