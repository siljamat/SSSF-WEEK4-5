import {GraphQLError} from 'graphql';
import catModel from '../models/catModel';
import {Cat, LocationInput, TokenContent} from '../../types/DBTypes';
import mongoose from 'mongoose';
import { MyContext } from '../../types/MyContext';
import { isAdmin, isLoggedIn } from '../../functions/authorize';
import fetchData from '../../functions/fetchData';


// TODO: create resolvers based on cat.graphql
// note: when updating or deleting a cat, you need to check if the user is the owner of the cat
// note2: when updating or deleting a cat as admin, you need to check if the user is an admin by checking the role from the user object
// note3: updating and deleting resolvers should be the same for users and admins. Use if statements to check if the user is the owner or an admin

export default {
    Query: {
        cats: async () => {
            return await catModel.find();
        },
        catById: async (_parent: undefined, args: {id: string}) => {
            return await catModel.findById(args.id);
        },
        catsByArea: async (_parent: undefined, args: LocationInput) => {
            const rightCorner = [args.topRight.lng, args.topRight.lat];
            const leftCorner = [args.bottomLeft.lng, args.bottomLeft.lat];
      
            return await catModel.find({
              location: {
                $geoWithin: {
                  $box: [leftCorner, rightCorner],
                },
              },
            });
          },
        catsByOwner: async (_parent: undefined, args: {owner: string}, context: MyContext) => {
            if (context.userdata?.user.id === args.owner) {
              return await catModel.find({owner: args.owner});
            }
            throw new GraphQLError('You are not the owner of the cats');
            },
    },
    Mutation: {
        createCat: async (
            _parent: undefined,
            args: {input: Omit<Cat, 'id'>},
            context: MyContext,
          ) => {
            isLoggedIn(context);
            args.input.owner = context.userdata?.user.id;
            return await catModel.create(args.input);
            },
        //role 'admin' or 'user' are determined by the token
        updateCat: async (
            _parent: undefined,
            args: {id: string; input: Partial<Omit<Cat, 'id'>>},
            context: MyContext,
          ) => {
            isLoggedIn(context);
            return await catModel.findByIdAndUpdate(args.id, args.input, {new: true});
            },
    //role 'admin' or 'user' are determined by the token
    deleteCat: async (_parent: undefined, args: {id: string}, context: MyContext) => {
        isLoggedIn(context);
        const filter = {_id: args.id, owner: context.userdata?.user.id};
        return await catModel.findOneAndDelete(filter);
        }
    },
};
