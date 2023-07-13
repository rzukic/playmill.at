import { useBreakpointValue, Text } from '@chakra-ui/react';
import { BsFillBookmarkCheckFill, BsFillPatchCheckFill } from 'react-icons/bs';

const Badge = ({ badge }) => {
  const isDesktop = useBreakpointValue({ base: false, md: true });
  return (
    <Text
      padding='1'
      borderRadius='md'
      fontSize={isDesktop ? 'sm' : 'xs'}
      textColor={badge.txt_color}
      backgroundColor={badge.bg_color}
      borderColor={badge.border_color}
      borderWidth='1px'>
      {badge.badge_text == 'premium' ? <BsFillPatchCheckFill /> : badge.badge_text}
    </Text>
  );
};

export default Badge;
