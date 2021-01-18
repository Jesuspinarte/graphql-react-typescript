import React from 'react';
import { Box, Button, Flex, Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useMeQuery } from '../generated/graphql';

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ data, fetching }] = useMeQuery();
  let body = null;

  return (
    <Flex bg="#252525" p={4} ml={'auto'}>
      <Box ml={'auto'}>
        {!fetching && !data?.me ? (
          <>
            <NextLink href="/login">
              <Link color={'white'} mr={2}>
                Login
              </Link>
            </NextLink>
            <NextLink href="/register">
              <Link color={'white'} mr={2}>
                Register
              </Link>
            </NextLink>
          </>
        ) : (
          <Flex>
            <Box color={'white'} mr={2}>
              {data?.me?.username}
            </Box>
            <Button variant='link' mr={2}>Logout</Button>
          </Flex>
        )}
      </Box>
    </Flex>
  );
};
