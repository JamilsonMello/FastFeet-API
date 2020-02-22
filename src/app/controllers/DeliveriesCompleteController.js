import { Op } from 'sequelize';
import Delivery from '../models/Delivery';

class DeliveryCompleteControlller {
  async index(req, res) {
    const { id } = req.params;
    const { page } = req.query;

    const deliveryman = await Delivery.findAll({
      where: {
        deliveryman_id: id,
        signature_id: { [Op.ne]: null },
      },
      limit: 30,
      offset: (page - 1) * 30,
    });

    if (!deliveryman) {
      return res.status(400).json({ error: 'User does not exist' });
    }

    return res.json(deliveryman);
  }
}

export default new DeliveryCompleteControlller();
