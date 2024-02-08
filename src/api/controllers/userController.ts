// TODO: create the following functions:
// - userGet - get user by id
// - userListGet - get all users
// - userPost - create new user. Remember to hash password
// - userPutCurrent - update current user
// - userDeleteCurrent - delete current user
// - checkToken - check if current user token is valid: return data from res.locals.user as UserOutput. No need for database query

import {NextFunction, Request, Response} from 'express';
import {User, UserInput, UserOutput} from '../../types/DBTypes';
import userModel from '../models/userModel';
import CustomError from '../../classes/CustomError';
import bcrypt from 'bcrypt';
import {MessageResponse, UploadResponse} from '../../types/MessageTypes';

const userGet = async (
  req: Request<{id: string}>,
  res: Response<User>,
  next: NextFunction
) => {
  try {
    const user = await userModel.findById(req.params.id).select('-role');
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const userListGet = async (
  _req: Request,
  res: Response<User[]>,
  next: NextFunction
) => {
  try {
    const users = await userModel.find({}, '-role');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const userPost = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    const salt = bcrypt.genSaltSync(10);

    const userInput = {
      user_name: req.body.user_name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, salt),
      role: 'user',
    };

    const user = await userModel.create(userInput);
    res.status(200).json({
      message: 'OK',
      data: {
        _id: user._id,
        user_name: user.user_name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

const userPutCurrent = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await userModel.findById(res.locals.user._id);
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    user.set(req.body);
    await user.save();
    res.json({
      message: 'OK',
      data: {
        _id: user._id,
        user_name: user.user_name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

const userDeleteCurrent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await userModel
      .findById(res.locals.user._id)
      .select('-password -role');
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    await userModel.findByIdAndDelete(user._id);
    res.status(200).json({
      message: 'User deleted',
      data: {
        _id: user._id,
        user_name: user.user_name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const checkToken = async (
  req: Request,
  res: Response<UserOutput>,
  next: NextFunction
) => {
  try {
    if (!res.locals.user || !('_id' in res.locals.user)) {
      throw new CustomError('No user', 400);
    }
    const {password, role, ...userWithoutPassOrRole} = res.locals.user;
    res.json(userWithoutPassOrRole);
  } catch (error) {
    next(error);
  }
};

export {
  userGet,
  userListGet,
  userPost,
  userPutCurrent,
  userDeleteCurrent,
  checkToken,
};
