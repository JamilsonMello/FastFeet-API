import * as Yup from 'yup';

import Problem from '../models/Problem';
import Delivery from '../models/Delivery';
import Deliveryman from '../models/Deliveryman';
import File from '../models/File';
import Recipient from '../models/Recipient';
import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';

class ProblemController {
  async index(req, res) {
    const { page } = req.query;

    const problems = await Problem.findAll({
      attributes: ['id', 'description'],
      limit: 30,
      offset: (page - 1) * 30,
      include: [
        {
          model: Delivery,
          as: 'delivery',
          attributes: ['id', 'product', 'start_date', 'end_date'],
          include: [
            {
              model: Recipient,
              as: 'recipient',
              attributes: [
                'id',
                'name',
                'street',
                'number',
                'complement',
                'state',
                'city',
                'zip_code',
              ],
            },
            {
              model: Deliveryman,
              as: 'deliveryman',
              attributes: ['id', 'name', 'email'],
              include: [
                {
                  model: File,
                  as: 'avatar',
                  attributes: ['name', 'path', 'url'],
                },
              ],
            },
            {
              model: File,
              as: 'signature',
              attributes: ['name', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(problems);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      description: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ error: 'Validation fails' });

    const { delivery_id } = req.params;
    const { description } = req.body;

    const delivery = await Delivery.findByPk(delivery_id);

    if (!delivery) {
      return res.status(400).json({ error: 'Delivery doest not exists' });
    }

    const { id } = await Problem.create({
      delivery_id,
      description,
    });

    const { recipient_id, deliveryman_id } = delivery;

    return res.json({
      Problem: {
        id,
        description,
      },
      delivery: {
        delivery_id: Number(delivery_id),
        recipient_id,
        deliveryman_id,
      },
    });
  }

  async show(req, res) {
    const { delivery_id } = req.params;

    const problems = await Problem.findByPk(delivery_id, {
      attributes: ['id', 'description'],
      include: [
        {
          model: Delivery,
          as: 'delivery',
          attributes: ['id', 'product', 'start_date', 'end_date'],
          include: [
            {
              model: Recipient,
              as: 'recipient',
              attributes: [
                'id',
                'name',
                'street',
                'number',
                'complement',
                'state',
                'city',
                'zip_code',
              ],
            },
            {
              model: Deliveryman,
              as: 'deliveryman',
              attributes: ['id', 'name', 'email'],
              include: [
                {
                  model: File,
                  as: 'avatar',
                  attributes: ['name', 'path', 'url'],
                },
              ],
            },
            {
              model: File,
              as: 'signature',
              attributes: ['name', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(problems);
  }

  async delete(req, res) {
    const { id } = req.params;
    const problem = await Problem.findByPk(id);

    if (!problem)
      return res.status(400).json({ error: "Delivery's problem not found" });

    const delivery = await Delivery.findByPk(problem.delivery_id, {
      attributes: ['id', 'product', 'canceled_at'],
      include: [
        {
          model: Deliveryman,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'id',
            'name',
            'street',
            'number',
            'complement',
            'state',
            'city',
            'zip_code',
          ],
        },
      ],
    });

    if (!delivery) {
      return res.status(500).json({
        error: 'The delivery that reference this problem has been not found',
      });
    }

    const { canceled_at } = await delivery.update({
      canceled_at: new Date(),
    });

    delivery.canceled_at = canceled_at;

    await delivery.save();

    await Queue.add(CancellationMail.key, {
      delivery,
      problem,
    });

    return res.json(delivery);
  }
}

export default new ProblemController();
