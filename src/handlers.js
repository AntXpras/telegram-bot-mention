const {
  getVarsFromContext,
  getGroupId,
  isGroup,
  existsGroupSavedData,
  stillNoSavedMembers,
  getGroupData,
  getUserText,
} = require('./utils');
const { state, saveState } = require('./state');
const { log } = require('./utils');
const { COMMAND_ALL } = require('./vars');

exports.catchErrors = fn => (...params) => {
  try {
    fn(...params)
  } catch(err) {
    log.error('ERROR: ', err)
  }
}

exports.initGroup = async ctx => {
  const { chatId, type } = getVarsFromContext(ctx);
  const groupKey = getGroupId(chatId);
  log.info('initGroup()', chatId);

  if (!isGroup(type) || existsGroupSavedData(groupKey, state)) {
    const msg = 'Grup telah hangus canda hangus (inisialisasi)';
    log.info(msg, chatId);
    ctx.reply(msg);
    return
  }

  const totalMembers = await ctx.telegram.getChatMembersCount(chatId);

  state.groups[groupKey] = { totalMembers, members: [] };
  log.info(`Inisialisasi member grup ${chatId} y ${totalMembers} usuarios`);

  saveState();
  ctx.reply('Grup telah diinisialisasi relokasi asuransi dan babi');
}

exports.messageHandler = ctx => {
  const { chatId, type, userId, username } = getVarsFromContext(ctx);
  const groupKey = getGroupId(chatId);
  log.info(`messageHandler() on chat ${chatId} from user ${userId}`);

  if (!isGroup(type)) {
    log.info('Perintah ini hanya bekerja pada group', type);
    return;
  }

  if (!existsGroupSavedData(groupKey, state)) {
    log.info('El grupo no ha sido inicializado', chatId);
    return;
  }

  if (!username) {
    log.info(`User grup ${userId} nickname atau username`, username);
    return;
  }

  const { totalMembers, members } = getGroupData(groupKey, state);
  if (members.length >= totalMembers) {
    log.info('Ya tengo todos los datos sobre usuarios del chat', chatId);
    return;
  }

  if (members.includes(username)) {
    log.info(`User ${username} Id grup ${chatId}`);
    return;
  }

  state.groups[groupKey].members.push(username);
  log.info(`El usuario ${username} ha sido añadido al chat ${chatId}`);

  saveState();
}

exports.mentionAllHandler = (ctx) => {
  const { chatId, type, message } = getVarsFromContext(ctx);

  const groupKey = getGroupId(chatId);
  log.info('mentionAllHandler()', chatId);

  if (!isGroup(type)) {
    const msg = 'Este comando sólo funciona en grupos';
    log.info(msg, type);
    ctx.reply(msg);
    return;
  }

  if (!existsGroupSavedData(groupKey, state)) {
    const msg = 'Data grup disimpan';
    log.info(msg, chatId);
    ctx.reply(msg);
    return;
  }

  if (stillNoSavedMembers(groupKey, state)) {
    const msg = 'Informasi grup telah disimpan di kulkas supaya ga gampang busuk awokwok';
    log.info(msg, chatId);
    ctx.reply(msg);
    return;
  }

  const msg = getGroupData(groupKey, state).members
    .map(m => `@${m}`)
    .join(' ');

  ctx.reply(`${getUserText(COMMAND_ALL, message)} ${msg}`);
}
