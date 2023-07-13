import { HStack, Text, useBreakpointValue } from '@chakra-ui/react';
import Badge from './badge';
import { BsFillBookmarkCheckFill } from 'react-icons/bs';

const UserBadges = ({ badges }) => {
  const isDesktop = useBreakpointValue({ base: false, md: true });
  return (
    <HStack
      overflow='auto'
      display={badges ? 'flex' : 'none'}>
      {badges &&
        badges.length > 0 &&
        badges.map((badge) => {
          return <Badge badge={badge} />;
        })}
    </HStack>
  );
};

export default UserBadges;
