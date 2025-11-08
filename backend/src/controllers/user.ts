import {Request, Response } from "express";
import { userEmailParam, paginationQuery, searchPaginationQuery } from "@schemas/user";
import { User } from "@db/user.model";
import { Translation } from "@db/translation.model";
import { AuthedRequest } from "@utils/authMiddleware";
import { validationError } from "@utils/errors";

function forbidden(res: Response) {
  return res.status(403).json({ status: "error", errType: "ForbiddenError" });
}

export async function getUserProfile(req: AuthedRequest, res: Response) {
  const params = userEmailParam.safeParse(req.params);

  if (!params.success) { // failed zod parse, return errors
    return validationError(res, params.error.issues)
  }

  console.log(`Attempting to fetch user ${params.data?.userEmail} profile`)

  try {

    // searching for user in DB
    const user = await User.findOne({ email: params.data.userEmail }).lean();

    if (!user) {
      return res.status(404).json({
        status: "error",
        errType: "UserNotFoundError",
        desc: "User not found"
      });
    }

    if (String(user._id) !== req.userId) return forbidden(res); // if jwt userId does not match fetched userId return forbidden

    const { password, refreshToken, updatedAt, __v, _id, ...safe } = user as any; // extracting non-sensitive user data

    console.log(`Successfully retrieve data for user ${user.email}`)
    return res.status(200).json({ status: "success", data: safe });

  } catch (e) {
    console.log("An error occurred when retrieving user information", e);
    return res.status(500).json({ status: "error", errType: "ServerError" });
  }
}

export async function listUserTranslations(req: AuthedRequest, res: Response) {
  const params = userEmailParam.safeParse(req.params);
  const query = paginationQuery.safeParse(req.query);
  if (!params.success) return validationError(res, params.error.issues);
  if (!query.success) return validationError(res, query.error.issues);

  try {
    const user = await User.findOne({ email: params.data.userEmail }).lean();
    if (!user) return res.status(404).json({ status: "error", errType: "UserNotFoundError", desc: "User not found" });

    if (String(user._id) !== req.userId) return forbidden(res);

    const { page, limit } = query.data;
    const skip: number = (page - 1) * limit; // calculating how many translations will get skipped

    const [items, total] = await Promise.all([
      Translation.find({ user: user._id })
        .sort({ createdAt: -1 }) // grabbing translation starting at newest
        .skip(skip)
        .limit(limit)
        .select("-__v")
        .lean(),
      Translation.countDocuments({ user: user._id }),
    ]);

    console.log(`Successfully gathered ${items.length} translations for user ${req.userId}`);
    return res.status(200).json({
      status: "success",
      data: items,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    return res.status(500).json({ status: "error", errType: "ServerError" });
  }
}


export async function searchUserTranslations(req: AuthedRequest, res: Response) {
  const body = searchPaginationQuery.safeParse(req.body);
  const params = userEmailParam.safeParse(req.params);
  const query = paginationQuery.safeParse(req.query);

  if (!body.success) return validationError(res, body.error.issues);
  if (!params.success) return validationError(res, params.error.issues);
  if (!query.success) return validationError(res, query.error.issues);

  try {
    const user = await User.findOne({ email: params.data.userEmail }).lean();
    if (!user) return res.status(404).json({ status: "error", errType: "UserNotFoundError", desc: "User not found" });

    if (String(user._id) !== req.userId) return forbidden(res); // preventing unauthorized attempts to reach this API on another users behalf

    const { page, limit } = query.data;
    const skip = ( page - 1 ) * limit;

    const dbQuery: Record<string, any> = { user: user._id, ...body.data }; // building db query

    // let the text properties allow partial matches
    if (dbQuery.sourceText) {
      dbQuery.sourceText = { $regex: body.data.sourceText, $options: "i"}
    }

    if (dbQuery.translatedText) {
      dbQuery.translatedText = { $regex: body.data.translatedText, $options: "i"}
    }

    const [items, total] = await Promise.all([
      Translation.find( dbQuery )
          .sort({ createdAt: -1 }) // grabbing translation starting at newest
          .skip(skip)
          .limit(limit)
          .select("-__v")
          .lean(),
      Translation.countDocuments( dbQuery ),
    ]);

    console.log(`Successfully gathered ${items.length} filtered translations for user ${req.userId}`);
    return res.status(200).json({
      status: "success",
      data: items,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });

  } catch (e) {
    return res.status(500).json({ status: "error", errType: "ServerError" });
  }
}