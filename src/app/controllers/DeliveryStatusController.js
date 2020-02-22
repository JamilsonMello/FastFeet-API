import Recipient from '../models/Recipient';
import Delivery from '../models/Delivery';

class DeliveryStatusController {
  async index(req, res) {
    const { page } = req.query;

    const { id } = req.params;

    const deliverymanExist = await Delivery.findOne({
      where: {
        deliveryman_id: id,
      },
    });

    if (!deliverymanExist) {
      return res.status(400).json({ error: 'Deliveryman does not exist' });
    }

    const deliveries = await Delivery.findAll({
      where: {
        deliveryman_id: id,
        canceled_at: null,
        signature_id: null,
      },
      limit: 30,
      offset: (page - 1) * 30,
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
      ],
    });

    return res.status(200).json(deliveries);
  }
}

export default new DeliveryStatusController();
