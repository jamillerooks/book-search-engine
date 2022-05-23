const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    
    Query: {
      me: async (_parent, _args, context) => {
        if (context.user) {
            const userData = await User.findOne({ _id: context.user._id })
                .select('-__v -password');
  
            return userData;
        }
        throw new AuthenticationError('You need to be logged in!');
    }
    },

  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('No user found with this email address');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);

      return { token, user };
    },
    // Add a third argument to the resolver to access data in our `context`
    saveBook: async (parent, { bookData }, context) => {
      // If context has a `user` property, that means the user executing this mutation has a valid JWT and is logged in
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
            { _id: context.user._id },
            { $push: { savedBooks: bookData } },
            { new: true }
        );
        return updatedUser;
    }
      
      // If user attempts to execute this mutation and isn't logged in, throw an error
      throw new AuthenticationError('You need to be logged in!');
       
    },
    removeBook: async (_parent, { bookId }, context) => {
      if (context.user) {
          const updatedUser = await User.findOneAndUpdate(
              { _id: context.user._id },
              { $pull: { savedBooks: { bookId } } },
              { new: true }
          );
          return updatedUser;
      }
      throw new AuthenticationError('You need to be logged in!');
  }
}
};

module.exports = resolvers;
