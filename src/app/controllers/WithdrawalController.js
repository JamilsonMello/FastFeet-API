import * as Yup from 'yup';
import {
  isBefore,
  setSeconds,
  setMinutes,
  setHours,
  parseISO,
  isAfter,
  isToday,
} from 'date-fns';

import { Op } from 'sequelize';
import Delivery from '../models/Delivery';

class WithdrawalController {
  async update(req, res) {
    const schema = Yup.object().shape({
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { deliveryman_id, delivery_id } = req.params;

    const { date } = req.body;

    if (!date) {
      return res.status(400).jaon({ error: 'Date not filled' });
    }

    const dateParsed = parseISO(date);

    if (!isToday(dateParsed)) {
      return res
        .status(401)
        .json({ error: 'You can`t do withdrawls in date future or past' });
    }

    const startDay = setSeconds(setMinutes(setHours(dateParsed, 8), 0), 0);
    const endDay = setSeconds(setMinutes(setHours(dateParsed, 18), 0), 0);

    if (isBefore(dateParsed, startDay) || isAfter(dateParsed, endDay)) {
      return res.status(401).json({ error: 'Schedule not allowed' });
    }

    const delivery = await Delivery.findOne({
      where: {
        id: delivery_id,
        deliveryman_id,
        start_date: null,
        canceled_at: null,
        signature_id: null,
      },
    });

    if (!delivery) {
      return res
        .status(400)
        .json({ error: "There's no delivery with this id" });
    }

    const { count } = await Delivery.findAndCountAll({
      where: {
        deliveryman_id,
        start_date: {
          [Op.between]: [startDay, endDay],
        },
      },
    });

    if (count >= 5) {
      return res.status(401).json({ error: 'You can only 5 withdrawls' });
    }

    delivery.start_date = dateParsed;

    const { id, start_date } = await delivery.save();

    return res.json({
      id,
      deliveryman_id: Number(deliveryman_id),
      start_date,
      deliveryToday: count,
    });
  }
}

export default new WithdrawalController();
