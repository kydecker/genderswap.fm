import satori from 'satori';
import sharp from 'sharp';
import { supabase } from '$lib/supabase';
import { getReadableTitle, getSortedTags } from '$lib/helpers';
import type { Cover } from '../+page.server';
import { TAGS, ORDERED_TAG_GROUPS } from '$lib/constants';

export async function GET({ params, url }) {
  const { slug } = params;

  const { data } = await supabase
    .from('covers')
    .select(
      `
      original:original_id(name, artists, album_img),
      cover:cover_id(name, artists, album_img),
      tags`
    )
    .eq('slug', slug!!)
    .returns<Cover>()
    .single();

  if (!data) {
    return new Response(null, {
      status: 404,
      statusText: 'Not found'
    });
  }

  const { original, cover, tags } = data as Cover;

  const title =
    original && cover
      ? getReadableTitle({
          originalName: original.name,
          originalArtists: original.artists,
          coverArtists: cover.artists
        })
      : 'A cover on Genderswap.fm';

  const displayTags = getSortedTags(tags)
    .slice(0, 4)
    .map((tag) => TAGS[tag].label);
  tags.length > 4 ? displayTags.push(`+${tags.length - 4}`) : null;

  const albumBoxShadow =
    '0px 2.7px 3.6px rgba(0, 0, 0, 0.024), 0px 7.5px 10px rgba(0, 0, 0, 0.035), 0px 18.1px 24.1px rgba(0, 0, 0, 0.046), 0px 60px 80px rgba(0, 0, 0, 0.07)';

  const html = {
    type: 'div',
    props: {
      style: {
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        backgroundColor: '#FDFCFD',
        fontFamily: 'Labil Grotesk',
        color: '#211F26',
        fontSize: '32px',
        padding: '48px 60px'
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'flex-start'
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    width: '55%',
                    paddingRight: '24px'
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize:
                            title.length > 70
                              ? '56px'
                              : title.length > 50
                              ? '64px'
                              : title.length > 30
                              ? '72px'
                              : '80px',
                          fontWeight: 700,
                          lineHeight: 1
                        },
                        children: title
                      }
                    }
                  ]
                }
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '32px',
                    width: '40%'
                  },
                  children: [
                    {
                      type: 'img',
                      props: {
                        src: original.album_img[0],
                        width: '340',
                        height: '340',
                        style: {
                          borderRadius: '6px',
                          boxShadow: albumBoxShadow,
                          objectFit: 'cover',
                          transform: 'rotate(-6deg) scale(0.9) translateX(132px) translateY(-16px)'
                        }
                      }
                    },
                    {
                      type: 'img',
                      props: {
                        src: cover.album_img[0],
                        width: '340',
                        height: '340',
                        style: {
                          borderRadius: '8px',
                          boxShadow: albumBoxShadow,
                          objectFit: 'cover',
                          transform: 'rotate(6deg) scale(1.1)'
                        }
                      }
                    }
                  ]
                }
              }
            ]
          }
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%'
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    gap: '8px'
                  },
                  children: displayTags.map((tag) => ({
                    type: 'div',
                    props: {
                      style: {
                        backgroundColor: '#F2EFF3',
                        padding: '6px 16px 9px 16px',
                        borderRadius: '12px',
                        fontSize: '28px',
                        lineHeight: 1.2,
                        color: '#65636D'
                      },
                      children: tag
                    }
                  }))
                }
              },
              {
                type: 'img',
                props: {
                  src: 'data:image/png;base64,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',
                  width: '168',
                  height: '96',
                  style: {
                    marginRight: '-8px'
                  }
                }
              }
            ]
          }
        }
      ]
    }
  };

  const labil = await fetch(new URL('/fonts/LabilGrotesk-Regular.woff', url)).then((res) =>
    res.arrayBuffer()
  );

  const labilBold = await fetch(new URL('/fonts/LabilGrotesk-Bold.woff', url)).then((res) =>
    res.arrayBuffer()
  );

  const svg = await satori(html, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Labil Grotesk',
        data: labil,
        style: 'normal',
        weight: 400
      },
      {
        name: 'Labil Grotesk',
        data: labilBold,
        style: 'normal',
        weight: 700
      }
    ]
  });

  const png = sharp(Buffer.from(svg)).png();
  const response = await png.toBuffer();

  return new Response(new Uint8Array(response), {
    status: 200,
    headers: {
      'Content-Type': 'image/png'
    }
  });
}
