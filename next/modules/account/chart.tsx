import React, { useContext, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  Center,
  Heading,
  Spinner,
  Tab,
  TabList,
  Tabs,
  useColorMode,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { getCookie } from 'cookies-next';
import apiBaseUrl from '../../lib/apiBaseURL';
import { UserContext } from '../../lib/userContext';
import localeContent from '../../locales/locale.json';
import { useRouter } from 'next/router';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function EloChart({ uid, userData }) {
  const timespans = ['week', 'month', 'year'];
  const [timespan, setTimespan] = useState(timespans[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  const session_key = getCookie('session_key');
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  useEffect(() => {
    fetch(`${apiBaseUrl}/elo?uid=${uid}&mode=${timespan}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && data.elo.find((a) => a.elo !== null)) {
          setData(data.elo);
        } else if (
          (data.error == 'no data' && userData && userData.elo) ||
          (data.elo &&
            !data.elo.find((a) => a.elo !== null) &&
            userData &&
            userData.elo)
        ) {
          const now = new Date();
          const data = [];
          switch (timespan) {
            case 'week':
              // create an entry for the last seven days with current user ELO
              const minusWeek = new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                new Date().getDate() - 7
              );
              for (let i = minusWeek; i < now; i.setDate(i.getDate() + 1)) {
                data.push({
                  date: i.toISOString().split('T')[0],
                  elo: userData.elo,
                });
              }
              break;
            case 'month':
              // create an entry for the last 30 days with current user ELO
              const minusMonth = new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                new Date().getDate() - 30
              );
              for (let i = minusMonth; i < now; i.setDate(i.getDate() + 1)) {
                data.push({
                  date: i.toISOString().split('T')[0],
                  elo: userData.elo,
                });
              }
              break;
            case 'year':
              // create an entry for the last 365 days with current user ELO
              const minusYear = new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                new Date().getDate() - 365
              );
              for (let i = minusYear; i < now; i.setDate(i.getDate() + 1)) {
                data.push({
                  date: i.toISOString().split('T')[0],
                  elo: userData.elo,
                });
              }
              break;
          }
          setData(data);
        } else {
          setData(null);
        }
        setIsLoading(false);
      });
  }, [timespan]);
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: useColorModeValue('gray.700', 'white'),
        },
      },
    },
  };
  if (isLoading) {
    return <Spinner />;
  } else if (data == null && userData && userData.elo) {
    return <></>;
  } else if (data == null && userData && !userData.elo) {
    return <Heading>Not ranked yet.</Heading>;
  }
  return (
    <VStack w='full'>
      <Heading size='md'>{content.account.elohistory}</Heading>
      <Tabs
        onChange={(i) => {
          setTimespan(timespans[i]);
        }}
      >
        <TabList>
          <Tab key='week'>{content.account.week}</Tab>
          <Tab key='month'>{content.account.month}</Tab>
          <Tab key='year'>{content.account.year}</Tab>
        </TabList>
      </Tabs>
      <Line
        options={options}
        data={{
          labels: data.map((a) => a.date),
          datasets: [
            {
              label: '(M)ELO',
              data: data.map((a) => a.elo),
              borderColor: '#71a343',
              backgroundColor: '#71a343',
            },
          ],
        }}
      />
    </VStack>
  );
}
