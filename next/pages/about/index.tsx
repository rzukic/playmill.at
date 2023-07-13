import {
  Center,
  Heading,
  VStack,
  Text,
  useBreakpointValue,
  Image,
  Link,
} from '@chakra-ui/react';
import millStockImage from './millStock.jpg';
import WMDImage from './WMD.png';
import localeContent from '../../locales/locale.json';
import { useRouter } from 'next/router';

const Home = () => {
  const { locale } = useRouter();
  const content = localeContent.languages[locale].content;
  const isDesktop = useBreakpointValue({ base: false, md: true });
  return (
    <Center m='10'>
      <VStack gap='2'>
        <Heading>{content.about.title}</Heading>
        <Text
          align='justify'
          w={isDesktop ? millStockImage.width : 'full'}
        >
          {content.about.snippets[0]}{' '}
          <Link
            href='https://en.wikipedia.org/wiki/Nine_men%27s_morris'
            color='teal.500'
            isExternal
          >
            {content.about.links[0]}
          </Link>
        </Text>
        <Image src={millStockImage.src} />
        <Text
          align='justify'
          w={isDesktop ? millStockImage.width : 'full'}
        >
          {content.about.snippets[1]}{' '}
          <Link
            href='/learn'
            color='teal.500'
          >
            {content.about.links[1]}
          </Link>
        </Text>
        <Text
          align='justify'
          w={isDesktop ? millStockImage.width : 'full'}
        >
          {content.about.snippets[2]}{' '}
          <Link
            href='http://www.muehlespiel.eu/images/pdf/WMD_Turnierreglement.pdf'
            color='teal.500'
            isExternal
          >
            {content.about.links[2]}
          </Link>
        </Text>
        <Image
          src={WMDImage.src}
          w={isDesktop ? millStockImage.width : 'full'}
        />
      </VStack>
    </Center>
  );
};

export default Home;
