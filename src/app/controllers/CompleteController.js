import * as Yup from 'yup';
import Delivery from '../models/Delivery';
import File from '../models/File';

class CompleteController {
  async update(req, res) {
    const schema = Yup.object().shape({
      signature_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation Fails' });
    }

    const { deliveryman_id: man_id, delivery_id } = req.params;

    const delivery = await Delivery.findOne({
      where: {
        id: delivery_id,
        deliveryman_id: man_id,
      },
    });

    if (!delivery) {
      return res.status(400).json({ error: 'delivery not exist' });
    }

    if (!delivery.start_date) {
      return res
        .status(400)
        .json({ error: 'This delivery was still withdrawn.' });
    }

    const { signature_id } = req.body;
    const signature = await File.findByPk(signature_id);

    if (!signature) {
      return res.status(400).json({ error: 'subscription does not exist' });
    }

    const {
      id,
      recipient_id,
      deliveryman_id,
      product,
      start_date,
      end_date,
    } = await delivery.update({ signature_id, end_date: new Date() });

    return res.json({
      id,
      recipient_id,
      deliveryman_id,
      signature_id,
      product,
      start_date,
      end_date,
    });
  }
}

export default new CompleteController();
