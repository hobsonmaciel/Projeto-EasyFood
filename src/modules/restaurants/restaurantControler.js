import { findAllRestaurants, findUserRestaurants, findRestaurantById, createRestaurant, updateRestaurant, deleteRestaurant } from './restaurantService.js';

export async function getRestaurants(req, res) {
  try {
    const restaurants = await findAllRestaurants();
    return res.json(restaurants);
  } catch (error) {
    console.error('Erro ao buscar restaurantes:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function getUserRestaurants(req, res) {
  try {
    const restaurants = await findUserRestaurants(req.user.id);
    return res.json(restaurants);
  } catch (error) {
    console.error('Erro ao buscar restaurantes do usuário:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

export async function postRestaurant(req, res) {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const category = typeof req.body.category === 'string' ? req.body.category.trim() : '';
  const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
  const address = typeof req.body.address === 'string' ? req.body.address.trim() : '';
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
  const { rating } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: 'Nome e categoria são obrigatórios' });
  }

  if (name.length > 120 || category.length > 80) {
    return res.status(400).json({ error: 'Nome ou categoria excedem o tamanho permitido' });
  }

  let normalizedRating = 0;
  if (rating !== undefined && rating !== null && rating !== '') {
    normalizedRating = Number(rating);

    if (!Number.isFinite(normalizedRating) || normalizedRating < 0 || normalizedRating > 5) {
      return res.status(400).json({ error: 'A avaliação deve estar entre 0 e 5' });
    }
  }

  try {
    const novoRestaurante = await createRestaurant({
      name,
      category,
      description,
      address,
      phone,
      rating: normalizedRating,
      userId: req.user.id
    });

    return res.status(201).json(novoRestaurante);
  } catch (error) {
    console.error('Erro ao cadastrar restaurante:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}

export async function putRestaurant(req, res) {
  const id = Number(req.params.id);
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const category = typeof req.body.category === 'string' ? req.body.category.trim() : '';
  const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
  const address = typeof req.body.address === 'string' ? req.body.address.trim() : '';
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
  const { rating } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: 'Nome e categoria são obrigatórios' });
  }

  if (name.length > 120 || category.length > 80) {
    return res.status(400).json({ error: 'Nome ou categoria excedem o tamanho permitido' });
  }

  let normalizedRating = 0;
  if (rating !== undefined && rating !== null && rating !== '') {
    normalizedRating = Number(rating);

    if (!Number.isFinite(normalizedRating) || normalizedRating < 0 || normalizedRating > 5) {
      return res.status(400).json({ error: 'A avaliação deve estar entre 0 e 5' });
    }
  }

  try {
    const restaurante = await findRestaurantById(id);

    if (!restaurante) {
      return res.status(404).json({ error: 'Restaurante não encontrado' });
    }

    if (restaurante.userId !== req.user.id) {
      return res.status(403).json({ error: 'Você não tem permissão para editar este restaurante' });
    }

    const atualizado = await updateRestaurant(id, {
      name,
      category,
      description,
      address,
      phone,
      rating: normalizedRating
    });

    return res.json(atualizado);
  } catch (error) {
    console.error('Erro ao atualizar restaurante:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}

export async function deleteRestaurantController(req, res) {
  const id = Number(req.params.id);

  try {
    const restaurante = await findRestaurantById(id);

    if (!restaurante) {
      return res.status(404).json({ error: 'Restaurante não encontrado' });
    }

    if (restaurante.userId !== req.user.id) {
      return res.status(403).json({ error: 'Você não tem permissão para deletar este restaurante' });
    }

    await deleteRestaurant(id);

    return res.json({ message: 'Restaurante deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar restaurante:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}