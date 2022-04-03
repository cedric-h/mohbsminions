What follows is the GDD for the most minimal, prototypical iteration of Mohb's Minions.

<a class="mk-toclify" id="table-of-contents"></a>

# Table of Contents
- [The Environment:](#the-environment)
    - [Pockets](#pockets)
- [Controls](#controls)
    - [Rock](#rock)
    - [Crystal](#crystal)
    - [Enemy](#enemy)
    - [Move here!](#move-here)
    - [Pan around](#pan-around)
- [Combat](#combat)
    - [Damage, hitpoints](#damage-hitpoints)
- [The Plot Arc/Big Picture](#the-plot-arcbig-picture)

<a class="mk-toclify" id="the-environment"></a>
# The Environment:
The player controls a group of 1 - 20 minions. They start out with 3.

They occupy an infinite underground environment comprised of destructible hexagonal tiles.

Their minions are not locked to this grid, and can occupy any point between two tiles,
as long as either tile is not occupied by rock or any other tile-based obstruction; in short, they can't walk through walls.

<a class="mk-toclify" id="pockets"></a>
## Pockets
Within this environment, there are pockets of air, groups of adjacent hexagons that have already been removed.
Each pocket sports an "attraction:"
- Start: The player begins in a pocket occupied by their starter minions.
- Crystal: Other pockets are occupied by crystals, which the player may use to create more minions.
- Enemy: Still more pockets are occupied by enemies, which will attempt to destroy the player's minions.

There is always space between the edge of the pocket and the attraction, such that when the player discovers
a new pocket, they are uncertain of its variety until they venture into it.

A dynamic, hexagonally-tiled lighting system prevents the player from viewing pockets that are not connected
by unoccupied tiles to any of their minions, again preventing them from discerning the nature of unopened pockets.

<a class="mk-toclify" id="controls"></a>
# Controls
The only way the player interacts with the world is by clicking.

<a class="mk-toclify" id="rock"></a>
## Rock
If they hold the mouse button down a rock, minions begin moving towards that rock.

All minions 3 minion-lengths of the rock begin to take turns smashing themselves against the rock.

An individual rock under assault by a determined group of minions lasts only a few seconds.

Only six minions can surround any given rock given their relative sizes and the constraints of the Cartesian plane.

If the number of minions you have exceeds the number of spaces adjacent the selected rock,
unoccupied minions will begin assaulting adjacent rocks instead.

The end result is that the more minions you have, the wider the tunnels are that you bore through the underground.
This increases the likelihood that one's tunnel intersects with a pocket, making the game faster paced as the player progresses.

Adjacent rocks onto which minions overflow must be part of the same contiguous body; in other words, one must
be able to draw a line of occupied rock tiles from the rock the player selected to the rock the minion begins to destroy.

<a class="mk-toclify" id="crystal"></a>
## Crystal
If they hold the mouse button down on a crystal, the same behavior as above occurs, with a few notable exceptions:

Should the number of minions under your command exceed the number of spaces adjacent the crystal selected,

minions will overflow to adjacent crystals, but not adjacent rocks. In other words, minions instructed to destroy crystal
will never destroy rock instead. The opposite is also true.

Upon the destruction of a crystal, another minion under your command is created.

<a class="mk-toclify" id="enemy"></a>
## Enemy
If the player holds the mouse button down on an enemy, their minions will begin an assault.

Similarly to the rocks and crystals, when one enemy is selected, the minions take this as permission to assault any
enemy in the vicinity. Unlike with the rocks and crystals, the vicinity is more loosely defined: there need not be
an uninterrupted line of tiles occupied by enemies between the selected enemy and the one a minion begins to assault.

Indeed, similar to the minions, the enemies are not actually tied to the grid of tiles, so this would be infeasible.
Rather, the minions take the player's selection of any enemy as a signal to approach the hostile creature
to which they are closest and which is not already surrounded by six attacking minions.

One notable consequence of this proximity based target selection is that all of the player's minions may converge on the single
enemy closest to the player's horde, leaving themselves open to attacks from enemies distanced farther away from the player's
horde. In short, they ain't too clever.

When the player's minions are within striking range, which is the same distance within which they begin destroying rock,
they will begin to assault and reduce the hitpoints of the given enemy.

<a class="mk-toclify" id="move-here"></a>
## Move here!
If the mouse is held down and the area underneath the mouse is unoccupied by rock, crystal, enemy, or any other obstruction,
the player's minions will begin marching towards this point in space in a straight line, without navigating around obstructions.

It is entirely possible to lose an individual minion in a cave somewhere because they got caught on the lip of a tunnel.

<a class="mk-toclify" id="pan-around"></a>
## Pan around
If the player begins moving the mouse immediately after holding it down, rather than interacting with the world,
they are able to pan the camera, allowing them to navigate maps larger than their screen size. However, because of the
dynamic lighting system, the game world outside of areas connected by unoccupied tiles to any of their minions will remain
invisible.

<a class="mk-toclify" id="combat"></a>
# Combat
When an enemy is in a "lit" area, meaning that the tile closest to their position is connected by a sequence of unoccupied tiles to
one underneath a minion, the enemy begins launching projectile based attacks. These projectiles move slowly enough that it may
be advantageous for the player to deselect an enemy, and instruct their minions to move towards a certain point so that they might
evade oncoming projectiles.

Recall that all minions converge upon the same selected point, so what may pull one minion out of harm's
way may very well lead to another's demise. Nobody said conducting a horde of well-intentioned, but unintelligent minions was easy.

<a class="mk-toclify" id="damage-hitpoints"></a>
## Damage, hitpoints
Minions have three limbs. Any projectile that a minion intersects with is absorbed, resulting in the loss of a limb. Minions with no
remaining limbs are dissolved. Minions with fewer limbs travel more slowly and attack less frequently.

Neither minions nor enemies regain hitpoints passively nor actively. Sustaining an attack renders a minion permanently less valuable.

<a class="mk-toclify" id="the-plot-arcbig-picture"></a>
# The Plot Arc/Big Picture
Discovering crystalline pockets and harvesting the crystals therein is the only way to recoup one's numbers.
Should the size of one's horde dwindle to zero, the player is rendered impotent. Without a critical mass of at least a single minion,
there is no way to recoup one's numbers or effect any change in the game world. There are no second chances in supervillainy. After
having lost, one may, however, continue to pan around and cavernous tracts one laid waste to in their doomed quest to amass an
insurmountable horde.

Due to the difficulty of boring tunnels when the size of one's horde dwindles, the game slows down considerably,
prolonging dramatic low-points. Indeed, if one's horde numbers fewer than 3, the most strategically sound option is to simply
restart the game, because a new game will start with more minions than one currently has. However, many players will forgo
this logically superior course of action due to a sentimental attachment to the minions they "went through hell and back" with.

Having sufficient aesthetic variation between minions may amplify this sentiment, especially if the appearance of the minion
is rooted in its story; if the minions one starts the game with are always one color, and all crystals in a pocket are the same color,
and minions derived from those crystals share the crystal's hue, then the player will be able to gauge the relative age and
timeline of their minions by their color, amplifying the sentimental attachment.
