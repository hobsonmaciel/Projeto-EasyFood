import prisma from '../../lib/prisma.js';

export async function findAllRestaurants() {
  return prisma.restaurant.findMany({
    orderBy: { id: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });
}

export async function findUserRestaurants(userId) {
  return prisma.restaurant.findMany({
    where: { userId },
    orderBy: { id: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });
}

export async function findRestaurantById(id) {
  return prisma.restaurant.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });
}

export async function createRestaurant({ name, category, description, address, phone, rating = 0, userId }) {
  return prisma.restaurant.create({
    data: {
      name,
      category,
      description,
      address,
      phone,
      rating,
      userId
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });
}

export async function updateRestaurant(id, { name, category, description, address, phone, rating }) {
  return prisma.restaurant.update({
    where: { id },
    data: {
      name,
      category,
      description,
      address,
      phone,
      rating
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });
}

export async function deleteRestaurant(id) {
  return prisma.restaurant.delete({
    where: { id }
  });
}