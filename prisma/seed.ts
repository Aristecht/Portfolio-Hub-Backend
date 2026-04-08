import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';
import { Pool } from 'pg';

import { PrismaClient } from './generated/prisma/client';

const pool = new Pool({ connectionString: process.env.POSTGRES_URI });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  // Create users
  const alicePassword = await argon2.hash('123456');
  const bobPassword = await argon2.hash('123456');
  const carolPassword = await argon2.hash('123456');

  const alice = await prisma.user.create({
    data: {
      username: 'alice',
      email: 'alice@example.com',
      displayName: 'Alice Example',
      password: alicePassword,
      avatar: 'https://i.pravatar.cc/300?u=alice',
    },
  });

  const bob = await prisma.user.create({
    data: {
      username: 'bob',
      email: 'bob@example.com',
      displayName: 'Bob Example',
      password: bobPassword,
      avatar: 'https://i.pravatar.cc/300?u=bob',
    },
  });

  const carol = await prisma.user.create({
    data: {
      username: 'carol',
      email: 'carol@example.com',
      displayName: 'Carol Example',
      password: carolPassword,
      avatar: 'https://i.pravatar.cc/300?u=carol',
    },
  });

  // Additional users to reach ~10 users total
  const extraUsernames = [
    'dave',
    'erin',
    'frank',
    'gina',
    'hank',
    'ivan',
    'jane',
  ];
  const extraUsers: Array<any> = [];
  for (const uname of extraUsernames) {
    const pwd = await argon2.hash('123456');
    const displayName =
      uname.charAt(0).toUpperCase() + uname.slice(1) + ' Example';
    const u = await prisma.user.create({
      data: {
        username: uname,
        email: `${uname}@example.com`,
        displayName,
        password: pwd,
        avatar: `https://i.pravatar.cc/300?u=${uname}`,
      },
    });
    extraUsers.push(u);
  }

  // Create albums and projects for additional users
  const extraAlbums: Array<any> = [];
  const extraProjects: Array<any> = [];
  for (const u of extraUsers) {
    const album = await prisma.album.create({
      data: {
        title: `${u.username} Album`,
        userId: u.id,
        thumbnailUrl: `https://picsum.photos/seed/${u.username}a/800/600`,
      },
    });
    extraAlbums.push(album);

    const project = await prisma.project.create({
      data: {
        title: `${u.username} Project`,
        description: `Sample project by ${u.username}`,
        tags: ['sample', u.username],
        albumId: album.id,
        media: {
          create: [
            { url: `https://picsum.photos/seed/${u.username}p/1200/800` },
          ],
        },
      },
    });
    extraProjects.push(project);
  }

  // Create albums
  const aliceAlbum = await prisma.album.create({
    data: {
      title: 'Alice Album',
      userId: alice.id,
      thumbnailUrl: 'https://picsum.photos/seed/alice/800/600',
    },
  });

  const bobAlbum = await prisma.album.create({
    data: {
      title: 'Bob Album',
      userId: bob.id,
      thumbnailUrl: 'https://picsum.photos/seed/bob/800/600',
    },
  });

  const carolAlbum = await prisma.album.create({
    data: {
      title: 'Carol Album',
      userId: carol.id,
      thumbnailUrl: 'https://picsum.photos/seed/carol/800/600',
    },
  });

  // Create projects for each album
  const projectA1 = await prisma.project.create({
    data: {
      title: 'Sunset Painting',
      description: 'A warm sunset over the hills.',
      tags: ['sunset', 'painting'],
      albumId: aliceAlbum.id,
      media: {
        create: [{ url: 'https://picsum.photos/seed/projectA1/1200/800' }],
      },
    },
  });

  const projectA2 = await prisma.project.create({
    data: {
      title: 'City Sketch',
      description: 'Pen sketch of downtown streets.',
      tags: ['sketch', 'city'],
      albumId: aliceAlbum.id,
      media: {
        create: [{ url: 'https://picsum.photos/seed/projectA2/1200/800' }],
      },
    },
  });

  const projectB1 = await prisma.project.create({
    data: {
      title: 'Mountain Photo',
      description: 'High-resolution mountain photo.',
      tags: ['photo', 'mountain'],
      albumId: bobAlbum.id,
      media: {
        create: [{ url: 'https://picsum.photos/seed/projectB1/1200/800' }],
      },
    },
  });

  const projectC1 = await prisma.project.create({
    data: {
      title: 'Abstract Art',
      description: 'Colorful abstract composition.',
      tags: ['abstract', 'digital'],
      albumId: carolAlbum.id,
      media: {
        create: [{ url: 'https://picsum.photos/seed/projectC1/1200/800' }],
      },
    },
  });

  // Create some comments across projects
  await prisma.comment.create({
    data: { text: 'Great work!', userId: bob.id, projectId: projectA1.id },
  });
  await prisma.comment.create({
    data: {
      text: 'Love the colors.',
      userId: carol.id,
      projectId: projectA1.id,
    },
  });
  await prisma.comment.create({
    data: {
      text: 'Nice composition.',
      userId: alice.id,
      projectId: projectB1.id,
    },
  });
  // comments from extra users on alice's project
  if (extraUsers.length >= 2) {
    await prisma.comment.create({
      data: {
        text: 'Inspiring!',
        userId: extraUsers[0].id,
        projectId: projectA2.id,
      },
    });
    await prisma.comment.create({
      data: {
        text: 'Amazing detail.',
        userId: extraUsers[1].id,
        projectId: projectA2.id,
      },
    });
  }

  // Add likes from various users to several projects
  const likePairs = [
    { user: extraUsers[0], project: projectA1 },
    { user: extraUsers[1], project: projectA1 },
    { user: extraUsers[2], project: projectB1 },
    { user: extraUsers[3], project: projectC1 },
    { user: alice, project: extraProjects[0] },
  ];

  for (const lp of likePairs) {
    try {
      await prisma.projectLike.create({
        data: { userId: lp.user.id, projectId: lp.project.id },
      });
    } catch (e) {
      // ignore unique constraint errors if any duplicate occurs while re-running
    }
  }

  // Update likes counts roughly to reflect created likes
  await prisma.project
    .update({ where: { id: projectA1.id }, data: { likes: 4 } })
    .catch(() => {});
  await prisma.project
    .update({ where: { id: projectB1.id }, data: { likes: 2 } })
    .catch(() => {});
  await prisma.project
    .update({ where: { id: projectC1.id }, data: { likes: 1 } })
    .catch(() => {});

  // Add some likes
  await prisma.projectLike.create({
    data: { userId: bob.id, projectId: projectA1.id },
  });
  await prisma.projectLike.create({
    data: { userId: carol.id, projectId: projectA1.id },
  });
  await prisma.projectLike.create({
    data: { userId: alice.id, projectId: projectB1.id },
  });

  // Increment like counts to reflect likes
  await prisma.project.update({
    where: { id: projectA1.id },
    data: { likes: 2 },
  });
  await prisma.project.update({
    where: { id: projectB1.id },
    data: { likes: 1 },
  });

  console.log('Seeding finished.');
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
