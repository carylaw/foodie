import { NextFunction, Request, Response } from 'express';
import { NOTIFICATIONS_LIMIT } from '../../../constants/constants';
import { makeErrorJson, makeResponseJson } from '../../../helpers/utils';
import { isAuthenticated } from '../../../middlewares/middlewares';
import Notification from '../../../schemas/NotificationSchema';

const router = require('express').Router({ mergeParams: true });

router.get(
    '/v1/notifications',
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            let offset = parseInt(req.query.offset as string) || 0;

            const limit = NOTIFICATIONS_LIMIT;
            const skip = offset * limit;

            const notifications = await Notification
                .find({ target: req.user._id })
                .populate('target initiator', 'profilePicture username fullname')
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip);
            const unreadCount = await Notification.find({ target: req.user._id, unread: true });
            const count = await Notification.find({ target: req.user._id });
            const result = { notifications, unreadCount: unreadCount.length, count: count.length };

            if (notifications.length === 0 && offset === 0) {
                return res.status(404).send(makeErrorJson({ message: 'You have no notifications.' }));
            } else if (notifications.length === 0 && offset >= 1) {
                return res.status(404).send(makeErrorJson({ message: 'No more notifications.' }));
            }

            res.status(200).send(makeResponseJson(result));
        } catch (e) {
            console.log(e);
            res.status(500).send(e);
        }
    }
);

router.get(
    '/v1/notifications/unread',
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const notif = await Notification.find({ target: req.user._id, unread: true });

            res.status(200).send(makeResponseJson({ count: notif.length }));
        } catch (e) {
            console.log('CANT GET UNREAD NOTIFICATIONS', e);
            res.status(400).send(e);
        }
    }
);

router.patch(
    '/v1/notifications/mark',
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await Notification
                .updateMany(
                    { target: req.user._id },
                    {
                        $set: {
                            unread: false
                        }
                    });
            res.status(200).send(makeResponseJson({ state: false }));
        } catch (e) {
            console.log('CANT MARK ALL AS UNREAD', e);
            res.status(400).send(e);
        }
    }
);

router.patch(
    '/v1/read/notification/:id',
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const notif = await Notification.findById(id);
            if (!notif) return res.sendStatus(400);

            const result = await Notification
                .findByIdAndUpdate(id, {
                    $set: {
                        unread: false
                    }
                });

            res.status(200).send(makeResponseJson({ state: false })) // state = false EQ unread = false
        } catch (e) {

        }
    }
);

export default router;
