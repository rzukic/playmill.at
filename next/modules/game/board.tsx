import { Box, Grid, GridItem, HStack, Image, Square, useBreakpointValue, VStack, Text, useToast, border } from '@chakra-ui/react';
import boardBg from '../../lib/resources/board.svg';
import whitePiece from '../../lib/resources/white.svg';
import blackPiece from '../../lib/resources/black.svg';
import empty from '../../lib/resources/empty.svg';
import blackGhost from '../../lib/resources/black.png';
import whiteGhost from '../../lib/resources/white.png';
import { useEffect, useState } from 'react';
import ReactTestUtils from 'react-dom/test-utils';
import { Game } from '../../lib/game/game';
import { validateConfig } from 'next/dist/server/config-shared';

const fieldsOrder = [
  'a7',
  'd7',
  'g7',
  'b6',
  'd6',
  'f6',
  'c5',
  'd5',
  'e5',
  'a4',
  'b4',
  'c4',
  'e4',
  'f4',
  'g4',
  'c3',
  'd3',
  'e3',
  'b2',
  'd2',
  'f2',
  'a1',
  'd1',
  'g1',
];

const Board = ({ board, socket, color, action }) => {
  const isLarge = useBreakpointValue({ base: false, '2xl': true });
  const isDesktop = useBreakpointValue({ base: false, xl: true });
  const isTablet = useBreakpointValue({ base: false, lg: true });
  const isMobile = useBreakpointValue({ base: false, md: true });
  const isTiny = useBreakpointValue({ base: false, sm: true });
  const [lastBoard, setLastBoard] = useState(null);
  const [portrait, setPortrait] = useState(false);
  const [possibleFields, setPossibleFields] = useState([]);
  const [listeners, setListeners] = useState({
    scroll: null,
    up: null,
  });
  useEffect(() => {
    if (window.innerHeight > window.innerWidth) {
      setPortrait(true);
    }
    window.addEventListener('resize', () => {
      if (window.innerHeight > window.innerWidth) {
        setPortrait(true);
      } else {
        setPortrait(false);
      }
    });
  }, []);
  const [selectedField, setSelectedField] = useState('side');
  const [fields, setFields] = useState([]);
  const findPossibleMoves = (field) => {
    const GameObject = new Game();
    GameObject.board = board;
    let opponentcolor = color === 'w' ? 'b' : 'w';
    let phase = 0;
    if (board[`${color}side`].filter((a) => a == color).length == 0) {
      phase = 1;
      if (Object.values(board).filter((a) => a == color).length == 3) {
        phase = 2;
      }
    }
    const allfields = Object.entries(board).filter((a) => typeof a[1] == 'string');
    let possiblefields = [];
    switch (action) {
      case 'move':
        switch (phase) {
          case 0:
            allfields.forEach((a) => {
              if (a[1] == 'x') {
                possiblefields.push(a[0]);
              }
            });
            break;
          case 1:
            const neighbors = GameObject.neighbors[field];
            neighbors.forEach((a) => {
              if (board[a] == 'x') {
                possiblefields.push(a);
              }
            });
            break;
          case 2:
            allfields.forEach((a) => {
              if (a[1] == 'x') {
                possiblefields.push(a[0]);
              }
            });
            break;
        }
        break;
      case 'take':
        const enemyfields = allfields.reduce((acc, cur) => {
          if (cur[1] == opponentcolor) {
            acc.push(cur[0]);
          }
          return acc;
        }, []);
        const notInMills = enemyfields.filter((a) => GameObject.isMill(a) == 0);
        if (notInMills.length == 0) {
          possiblefields = enemyfields;
        } else {
          possiblefields = notInMills;
        }
        break;
    }
    setPossibleFields(possiblefields);
  };
  const unsetPossibleMoves = () => {
    if (action == 'take') return;
    setPossibleFields([]);
  };
  const opponentcolor = color === 'w' ? 'b' : 'w';
  useEffect(() => {
    if (!board) return;
    let f = [];
    for (let i = 0; i < 49; i++) {
      const index = [0, 3, 6, 8, 10, 12, 16, 17, 18, 21, 22, 23, 25, 26, 27, 30, 31, 32, 36, 38, 40, 42, 45, 48].indexOf(i);
      if (index !== -1) {
        f.push({
          fieldType: board[fieldsOrder[index]],
          fieldCode: fieldsOrder[index],
        });
      } else {
        f.push({
          fieldType: 'n',
        });
      }
    }
    setFields(f);
    unsetPossibleMoves();
    if (action == 'take') {
      findPossibleMoves(null);
    }
  }, [lastBoard]);
  if (!board || !color) return <></>;
  if (!shallowEqual(board, lastBoard)) {
    setLastBoard({ ...board });
  }
  if (fields.length == 0) return null;
  return (
    <VStack
      w={
        portrait
          ? isTiny
            ? isMobile
              ? '60vw'
              : '80vw'
            : '90vw'
          : isLarge
          ? '60vh'
          : isDesktop
          ? '60vh'
          : isTablet
          ? '60vh'
          : isMobile
          ? '60vh'
          : 'full'
      }
      gap='0'>
      <Grid
        w='full'
        templateColumns={`repeat(9, 1fr)`}
        templateRows={`repeat(1, 1fr)`}
        m='0'
        gap='2'>
        {board[`${opponentcolor}side`].map((a, index) =>
          a === 'w' ? (
            <WhitePiece
              draggable={false}
              takeable={false}
              key={index}
              socket={socket}
              setSelectedField={setSelectedField}
              findPossibleMoves={findPossibleMoves}
              unsetPossibleMoves={unsetPossibleMoves}
              possibleFields={possibleFields}
              listeners={listeners}
              setListeners={setListeners}
            />
          ) : (
            <BlackPiece
              draggable={false}
              takeable={false}
              key={index}
              socket={socket}
              setSelectedField={setSelectedField}
              findPossibleMoves={findPossibleMoves}
              unsetPossibleMoves={unsetPossibleMoves}
              possibleFields={possibleFields}
              listeners={listeners}
              setListeners={setListeners}
            />
          )
        )}
        {board[`${opponentcolor}side`].length == 0 && <EmptyPlaceholder />}
      </Grid>
      <Box
        bg={`url(${boardBg.src})`}
        w='full'
        p={`${100 / 8 / 2}%`}
        mt='0'>
        <Grid
          templateColumns={`repeat(7, 1fr)`}
          templateRows={`repeat(7, 1fr)`}
          gap={0}>
          {fields.map((a, index) =>
            a.fieldType === 'n' ? (
              <Square key={index}></Square>
            ) : a.fieldType === 'w' ? (
              <WhitePiece
                draggable={color === 'w' && board['wside'].filter((a) => a == 'w').length == 0}
                takeable={color === 'b' && action === 'take'}
                key={index}
                currentfield={a.fieldCode}
                socket={socket}
                setSelectedField={setSelectedField}
                findPossibleMoves={findPossibleMoves}
                unsetPossibleMoves={unsetPossibleMoves}
                possibleFields={possibleFields}
                listeners={listeners}
                setListeners={setListeners}
              />
            ) : a.fieldType === 'b' ? (
              <BlackPiece
                draggable={color === 'b' && board['bside'].filter((a) => a == 'b').length == 0}
                takeable={color === 'w' && action === 'take'}
                key={index}
                currentfield={a.fieldCode}
                socket={socket}
                setSelectedField={setSelectedField}
                findPossibleMoves={findPossibleMoves}
                unsetPossibleMoves={unsetPossibleMoves}
                possibleFields={possibleFields}
                listeners={listeners}
                setListeners={setListeners}
              />
            ) : (
              <EmptySpace
                key={index}
                currentfield={a.fieldCode}
                action={action}
                socket={socket}
                selectedField={selectedField}
                possibleFields={possibleFields}
                setSelectedField={setSelectedField}
              />
            )
          )}
        </Grid>
      </Box>
      <Grid
        w='full'
        templateColumns={`repeat(9, 1fr)`}
        templateRows={`repeat(1, 1fr)`}
        m='0'
        gap='2'>
        {board[`${color}side`].map((a, index) =>
          a === 'w' ? (
            <WhitePiece
              draggable={color === 'w'}
              takeable={false}
              key={index}
              socket={socket}
              setSelectedField={setSelectedField}
              findPossibleMoves={findPossibleMoves}
              unsetPossibleMoves={unsetPossibleMoves}
              possibleFields={possibleFields}
              listeners={listeners}
              setListeners={setListeners}
            />
          ) : (
            <BlackPiece
              draggable={color === 'b'}
              takeable={false}
              key={index}
              socket={socket}
              setSelectedField={setSelectedField}
              findPossibleMoves={findPossibleMoves}
              unsetPossibleMoves={unsetPossibleMoves}
              possibleFields={possibleFields}
              listeners={listeners}
              setListeners={setListeners}
            />
          )
        )}
        {board[`${color}side`].length == 0 && <EmptyPlaceholder />}
      </Grid>
    </VStack>
  );
};

const BlackPiece = ({
  draggable,
  takeable,
  socket,
  setSelectedField,
  findPossibleMoves,
  unsetPossibleMoves,
  possibleFields,
  listeners,
  setListeners,
  currentfield = 'side',
}) => {
  return (
    <Piece
      draggable={draggable}
      takeable={takeable}
      socket={socket}
      setSelectedField={setSelectedField}
      currentfield={currentfield}
      findPossibleMoves={findPossibleMoves}
      unsetPossibleMoves={unsetPossibleMoves}
      possibleFields={possibleFields}
      listeners={listeners}
      setListeners={setListeners}
      img={blackPiece}
    />
  );
};

const WhitePiece = ({
  draggable,
  takeable,
  socket,
  setSelectedField,
  findPossibleMoves,
  unsetPossibleMoves,
  possibleFields,
  listeners,
  setListeners,
  currentfield = 'side',
}) => {
  return (
    <Piece
      draggable={draggable}
      takeable={takeable}
      socket={socket}
      setSelectedField={setSelectedField}
      currentfield={currentfield}
      findPossibleMoves={findPossibleMoves}
      unsetPossibleMoves={unsetPossibleMoves}
      possibleFields={possibleFields}
      listeners={listeners}
      setListeners={setListeners}
      img={whitePiece}
    />
  );
};

const Piece = ({
  draggable,
  takeable,
  socket,
  setSelectedField,
  findPossibleMoves,
  unsetPossibleMoves,
  possibleFields,
  listeners,
  setListeners,
  currentfield = 'side',
  img,
}) => {
  const [dragImg, setDragImg] = useState(null);
  const [lastPostion, setLastPosition] = useState(null);
  const [el, setEl] = useState(null);
  const toast = useToast();
  const isPossible = possibleFields.includes(currentfield);
  const [isGrabbed, setIsGrabbed] = useState(false);
  return (
    <Box
      draggable={draggable}
      css={{
        touchAction: 'none',
        transition: 'all linear',
      }}
      backgroundColor={isPossible ? 'rgba(229, 62, 62, 0.2)' : 'transparent'}
      _hover={draggable ? { cursor: 'grab', background: 'blackAlpha.400' } : takeable ? { cursor: 'pointer', background: 'blackAlpha.400' } : {}}
      _grabbed={
        draggable && {
          cursor: 'grabbing',
        }
      }
      borderRadius='lg'
      onMouseDown={(e) => {
        e.preventDefault();
        if (draggable) {
          setSelectedField(currentfield);
        } else if (takeable) {
          socket.emit('take', JSON.stringify({ from: currentfield }));
          return;
        } else {
          return;
        }
        const unset = possibleFields.length > 0 && listeners.setBy == currentfield;
        findPossibleMoves(currentfield);
        e.currentTarget.style.cursor = 'grabbing';
        e.currentTarget.style.opacity = '0';
        const img = e.currentTarget;
        const newImg = img.cloneNode(true) as HTMLElement;
        newImg.style.opacity = '1';
        newImg.style.position = 'absolute';
        newImg.style.zIndex = '100';
        newImg.style.backgroundColor = 'transparent';
        const halfWidth = img.offsetHeight / 2;
        newImg.style.top = `${e.pageY - halfWidth}px`;
        newImg.style.left = `${e.pageX - halfWidth}px`;
        newImg.style.width = `${img.offsetHeight}px`;
        newImg.style.height = `${img.offsetHeight}px`;
        let el = null;
        document.body.appendChild(newImg);
        let y = e.pageY;
        let x = e.pageX;
        const handleMove = (e) => {
          newImg.style.top = `${e.clientY - halfWidth + window.scrollY}px`;
          y = e.clientY;
          newImg.style.left = `${e.clientX - halfWidth + window.scrollX}px`;
          x = e.clientX;
          const newEl = document.elementsFromPoint(e.pageX - window.scrollX, e.pageY - window.scrollY).find((a) => fieldsOrder.includes(a.id));
          if (newEl) {
            if (el != null && el.id !== newEl.id) {
              ReactTestUtils.Simulate.dragLeave(el);
              ReactTestUtils.Simulate.dragEnter(newEl);
              el = newEl;
            } else if (el == null || el.id !== newEl.id) {
              ReactTestUtils.Simulate.dragEnter(newEl);
              el = newEl;
            }
          } else if (el != null) {
            ReactTestUtils.Simulate.dragLeave(el);
            el = null;
          }
        };
        window.removeEventListener('scroll', listeners.scroll);
        window.removeEventListener('mouseup', listeners.up);
        window.addEventListener('mousemove', handleMove);
        const handleScroll = (e) => {
          newImg.style.top = `${y - halfWidth + window.scrollY}px`;
          newImg.style.left = `${x - halfWidth + window.scrollX}px`;
        };
        window.addEventListener('scroll', handleScroll);
        const handleUp = (e) => {
          window.removeEventListener('mousemove', handleMove);
          window.removeEventListener('scroll', handleScroll);
          if (unset) {
            unsetPossibleMoves();
          }
          if (el != null) {
            ReactTestUtils.Simulate.dragLeave(el);
            ReactTestUtils.Simulate.drop(el, {
              dataTransfer: {
                getData: () => currentfield,
              },
            });
            el = null;
          }
          newImg.remove();
          img.style.opacity = '1';
        };
        window.addEventListener('mouseup', handleUp);
        setListeners({ scroll: handleScroll, up: handleUp, setBy: currentfield });
      }}
      onDragStart={(e) => {
        e.preventDefault();
      }}
      onTouchStart={
        draggable
          ? (e) => {
              findPossibleMoves(currentfield);
              const img = e.currentTarget;
              img.style.opacity = '0';
              const newImg = img.cloneNode(true) as HTMLElement;
              newImg.style.opacity = '1';
              newImg.style.position = 'absolute';
              newImg.style.top = '-1000px';
              newImg.style.left = '-1000px';
              newImg.style.width = img.offsetWidth + 'px';
              newImg.style.height = img.offsetWidth + 'px';
              newImg.style.scale = '2';
              document.body.appendChild(newImg);
              setDragImg(newImg);
            }
          : (e) => {}
      }
      onTouchMove={
        draggable
          ? (e) => {
              if (e.touches[0].pageX + Number(dragImg.style.width.replace('px', '')) >= window.innerWidth) return;
              let x = e.touches[0].pageX - Number(dragImg.style.width.replace('px', '')) * 0.5;
              let y = e.touches[0].pageY - Number(dragImg.style.width.replace('px', '')) * 0.5;
              dragImg.style.left = x + 'px';
              dragImg.style.top = y + 'px';
              setLastPosition({ x: e.touches[0].pageX - window.scrollX, y: e.touches[0].pageY - window.scrollY });
              let newEl = document
                .elementsFromPoint(e.touches[0].pageX - window.scrollX, e.touches[0].pageY - window.scrollY)
                .find((a) => fieldsOrder.includes(a.id));
              if (newEl) {
                if (el != null && el.id !== newEl.id) {
                  ReactTestUtils.Simulate.dragLeave(el);
                  ReactTestUtils.Simulate.dragEnter(newEl);
                  setEl(newEl);
                } else if (el == null || el.id !== newEl.id) {
                  ReactTestUtils.Simulate.dragEnter(newEl);
                  setEl(newEl);
                }
              } else if (el != null) {
                ReactTestUtils.Simulate.dragLeave(el);
                setEl(null);
              }
            }
          : (e) => {}
      }
      onTouchEnd={
        draggable
          ? (e) => {
              dragImg.style.opacity = '0';
              e.currentTarget.style.opacity = '1';
              document.body.removeChild(dragImg);
              if (!lastPostion) return;
              let newEl = document
                .elementsFromPoint(lastPostion.x - window.scrollX, lastPostion.y - window.scrollX)
                .find((a) => fieldsOrder.includes(a.id));
              if (newEl) {
                ReactTestUtils.Simulate.dragLeave(newEl);
                ReactTestUtils.Simulate.drop(newEl, {
                  dataTransfer: {
                    getData: () => {
                      return currentfield;
                    },
                  },
                });
              }
            }
          : (e) => {}
      }
      onTouchCancel={
        draggable
          ? (e) => {
              unsetPossibleMoves();
              dragImg.style.opacity = '0';
              e.currentTarget.style.opacity = '1';
              document.body.removeChild(dragImg);
            }
          : (e) => {}
      }
      onClick={
        draggable
          ? (e) => {
              setSelectedField(currentfield);
            }
          : takeable
          ? (e) => {
              socket.emit('take', JSON.stringify({ from: currentfield }));
            }
          : (e) => {}
      }>
      <Image src={img.src} />
    </Box>
  );
};

const EmptySpace = ({ action, socket, selectedField, setSelectedField, possibleFields, currentfield = '' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isPossible = possibleFields.includes(currentfield);
  return (
    <Box
      id={currentfield}
      _hover={{
        cursor: 'pointer',
        background: 'blackAlpha.400',
      }}
      background={isHovered ? 'blackAlpha.400' : isPossible ? 'rgba(229, 62, 62, 0.2)' : 'transparent'}
      border={isHovered ? '2px solid #71a343' : '0px'}
      borderRadius='lg'
      onDragStart={(e) => {
        e.preventDefault();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setIsHovered(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsHovered(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        const from = e.dataTransfer.getData('text/plain');
        if (!fieldsOrder.includes(from) && from != 'side') return;
        if (action === 'move') {
          socket.emit('move', JSON.stringify({ from, to: currentfield }));
        }
      }}
      onClick={(e) => {
        if (action === 'move' && selectedField) {
          socket.emit('move', JSON.stringify({ from: selectedField, to: currentfield }));
        }
      }}>
      <Image src={empty.src} />
    </Box>
  );
};

const EmptyPlaceholder = () => {
  return (
    <Box>
      <Image src={empty.src} />
    </Box>
  );
};

const Ghost = ({ color }) => {
  return (
    <img
      src={color === 'w' ? whiteGhost.src : blackGhost.src}
      width='100'
      height='100'
    />
  );
};

export default Board;

function shallowEqual(object1, object2) {
  if (object1 === object2) return true;
  if (object1 == null || object2 == null) return false;
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let key of keys1) {
    if (object1[key] !== object2[key]) {
      return false;
    }
  }

  return true;
}
